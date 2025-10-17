#!/usr/bin/env python3
"""
Network Monitor - Electron Version
Modified for Electron desktop application
"""

from flask import Flask, render_template, jsonify
from flask_socketio import SocketIO
from flask_cors import CORS
import threading
import time
import os
import sys
from datetime import datetime
from collections import defaultdict, deque
import psutil
import json
import logging

# Try to import scapy, but work without it
try:
    from scapy.all import sniff, IP, TCP, UDP, ICMP, ARP
    SCAPY_AVAILABLE = True
except ImportError:
    SCAPY_AVAILABLE = False

# Configuration for Electron
class Config:
    SECRET_KEY = 'electron-network-monitor-secret-key'
    HOST = '127.0.0.1'  # Localhost for Electron
    PORT = 5000
    DEBUG = False
    UPDATE_INTERVAL = 2
    MAX_PACKETS = 50
    MAX_CONNECTIONS = 30

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)
socketio = SocketIO(app, 
                   async_mode='threading',
                   cors_allowed_origins="*",
                   ping_timeout=60,
                   ping_interval=25,
                   logger=False,
                   engineio_logger=False)

class NetworkMonitor:
    def __init__(self):
        self.packet_count = 0
        self.protocol_stats = defaultdict(int)
        self.recent_packets = deque(maxlen=Config.MAX_PACKETS)
        self.start_time = time.time()
        self.running = True
        self.connections = []
        self.lock = threading.Lock()
        
        # Start monitoring threads
        if SCAPY_AVAILABLE:
            self.capture_thread = threading.Thread(target=self.capture_packets, daemon=True)
            self.capture_thread.start()
            logger.info("Packet capture thread started")
            print("[OK] Packet capture: ENABLED")
        else:
            logger.warning("Scapy not available - packet capture disabled")
            print("[WARN]  Packet capture: DISABLED (install scapy)")
        
        self.update_thread = threading.Thread(target=self.broadcast_updates, daemon=True)
        self.update_thread.start()
        logger.info("Update broadcast thread started")
        print("[START] Network Monitor started successfully")
        print(f"[URL] Server running on: http://{Config.HOST}:{Config.PORT}")
    
    def capture_packets(self):
        """Capture network packets using Scapy"""
        try:
            def packet_handler(packet):
                with self.lock:
                    self.packet_count += 1
                    
                    packet_info = {
                        'time': datetime.now().strftime("%H:%M:%S.%f")[:-3],
                        'protocol': 'Unknown',
                        'src': 'N/A',
                        'dst': 'N/A',
                        'length': len(packet),
                        'info': ''
                    }
                    
                    if IP in packet:
                        packet_info['src'] = packet[IP].src
                        packet_info['dst'] = packet[IP].dst
                        
                        if TCP in packet:
                            packet_info['protocol'] = 'TCP'
                            self.protocol_stats['TCP'] += 1
                            packet_info['info'] = f"ports: {packet[TCP].sport}→{packet[TCP].dport}"
                        elif UDP in packet:
                            packet_info['protocol'] = 'UDP'
                            self.protocol_stats['UDP'] += 1
                            packet_info['info'] = f"ports: {packet[UDP].sport}→{packet[UDP].dport}"
                        elif ICMP in packet:
                            packet_info['protocol'] = 'ICMP'
                            self.protocol_stats['ICMP'] += 1
                            packet_info['info'] = f"type: {packet[ICMP].type}"
                    elif ARP in packet:
                        packet_info['protocol'] = 'ARP'
                        self.protocol_stats['ARP'] += 1
                        packet_info['src'] = packet[ARP].psrc
                        packet_info['dst'] = packet[ARP].pdst
                        packet_info['info'] = "arp_request"
                    
                    self.recent_packets.append(packet_info)
            
            logger.info("Starting packet capture...")
            sniff(prn=packet_handler, store=False)
        except PermissionError:
            error_msg = "Permission denied - run with administrator privileges for packet capture"
            logger.error(error_msg)
            print(f"[ERROR] {error_msg}")
        except Exception as e:
            error_msg = f"Packet capture error: {e}"
            logger.error(error_msg)
            print(f"[ERROR] {error_msg}")
    
    def get_active_connections(self):
        """Get active network connections"""
        connections = []
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.laddr:
                    local_addr = f"{conn.laddr.ip}:{conn.laddr.port}"
                    remote_addr = f"{conn.raddr.ip}:{conn.raddr.port}" if conn.raddr else 'N/A'
                    connections.append({
                        'local': local_addr,
                        'remote': remote_addr,
                        'status': conn.status,
                        'pid': conn.pid if conn.pid else 'N/A'
                    })
        except (PermissionError, psutil.AccessDenied):
            logger.warning("Limited permissions - some connections may not be visible")
        except Exception as e:
            logger.error(f"Connection error: {e}")
        return connections
    
    def get_network_stats(self):
        """Get comprehensive network statistics"""
        try:
            net_io = psutil.net_io_counters()
            return {
                'bytes_sent': net_io.bytes_sent,
                'bytes_recv': net_io.bytes_recv,
                'packets_sent': net_io.packets_sent,
                'packets_recv': net_io.packets_recv
            }
        except Exception as e:
            logger.error(f"Network stats error: {e}")
            return {
                'bytes_sent': 0,
                'bytes_recv': 0,
                'packets_sent': 0,
                'packets_recv': 0
            }
    
    def format_bytes(self, bytes_val):
        """Format bytes to human readable"""
        for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
            if bytes_val < 1024.0:
                return f"{bytes_val:.2f} {unit}"
            bytes_val /= 1024.0
        return f"{bytes_val:.2f} PB"
    
    def format_uptime(self, seconds):
        """Format uptime"""
        h = int(seconds // 3600)
        m = int((seconds % 3600) // 60)
        s = int(seconds % 60)
        return f"{h:02d}:{m:02d}:{s:02d}"
    
    def broadcast_updates(self):
        """Broadcast updates to all connected clients"""
        while self.running:
            try:
                with self.lock:
                    connections = self.get_active_connections()
                    net_stats = self.get_network_stats()
                    
                    data = {
                        'packet_count': self.packet_count,
                        'protocol_stats': dict(self.protocol_stats),
                        'recent_packets': list(self.recent_packets)[-30:],
                        'connections': connections[:Config.MAX_CONNECTIONS],
                        'network_stats': net_stats,
                        'uptime': self.format_uptime(time.time() - self.start_time),
                        'scapy_available': SCAPY_AVAILABLE,
                        'active_connections_count': len(connections)
                    }
                
                socketio.emit('network_update', data)
                time.sleep(Config.UPDATE_INTERVAL)
            except Exception as e:
                logger.error(f"Broadcast error: {e}")
                time.sleep(Config.UPDATE_INTERVAL)
    
    def stop(self):
        """Stop monitoring"""
        self.running = False
        logger.info("Monitor stopped")
        print("[STOP] Monitor stopped")

# Global monitor instance
monitor = None

@app.route('/')
def index():
    """Main page"""
    return render_template('index.html', 
                         scapy_available=SCAPY_AVAILABLE,
                         start_time=monitor.start_time if monitor else time.time())

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'uptime': monitor.format_uptime(time.time() - monitor.start_time) if monitor else '00:00:00',
        'scapy_available': SCAPY_AVAILABLE
    })

@app.route('/stats')
def get_stats():
    """API endpoint for current stats"""
    if monitor:
        return jsonify({
            'packet_count': monitor.packet_count,
            'protocol_stats': dict(monitor.protocol_stats),
            'uptime': monitor.format_uptime(time.time() - monitor.start_time)
        })
    return jsonify({'error': 'Monitor not initialized'}), 500

@socketio.on('connect')
def handle_connect():
    """Handle client connection"""
    logger.info("Client connected")

@socketio.on('disconnect')
def handle_disconnect():
    """Handle client disconnect"""
    logger.info("Client disconnected")

def create_app():
    """Application factory"""
    global monitor
    monitor = NetworkMonitor()
    return app

def main():
    """Main entry point"""
    print("=" * 60)
    print("[START] Network Monitor - Electron Version")
    print("=" * 60)
    
    global monitor
    monitor = NetworkMonitor()
    
    try:
        socketio.run(app, 
                    host=Config.HOST, 
                    port=Config.PORT, 
                    debug=Config.DEBUG,
                    allow_unsafe_werkzeug=True)
    except KeyboardInterrupt:
        print("\n[STOP] Shutting down...")
        if monitor:
            monitor.stop()
        logger.info("Application stopped")
    except Exception as e:
        logger.error(f"Application error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()