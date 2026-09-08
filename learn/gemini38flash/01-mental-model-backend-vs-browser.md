# 01. Mental Model: Backend vs Browser

Bagi programmer backend, memahami Micro-Frontend (MFE) memerlukan penyesuaian sudut pandang (*mental shift*) terhadap lingkungan eksekusi klien (browser).

---

## 1. Perbandingan Karakteristik Runtime

| Aspek Arsitektur | Lingkungan Backend (Microservices) | Lingkungan Browser (Micro-Frontend) |
| :--- | :--- | :--- |
| **Proses Eksekusi** | Multi-proses, multi-kontainer (Docker), multi-server. Tiap service memiliki PID, OS, dan RAM terpisah. | **Single Thread (V8 Engine)** dan **Single Memory Heap** di dalam 1 tab browser yang sama. |
| **Isolasi Memori** | Terisolasi total di level sistem operasi. Service A crash tidak akan memengaruhi alokasi memori Service B. | **Tidak ada isolasi proses otomatis**. Shell dan semua Child MFE berbagi objek global yang sama: `window` dan `document`. |
| **Jalur Komunikasi** | Jaringan fisik (TCP/IP, HTTP/2, gRPC) atau Message Broker eksternal (Kafka, RabbitMQ). | Memori RAM lokal (EventBus berbasis `CustomEvent`), callback JavaScript, atau query string di URL bar. |
| **Penyedia Routing** | Hardware/Software Reverse Proxy (Nginx, Kong, Traefik, AWS ALB). | Memori browser via **HTML5 History API** (`window.history.pushState`) yang dikelola oleh library routing (React Router). |
| **Penanganan Kegagalan** | Circuit Breaker (Hystrix/Resilience4j), load balancer auto-failover, container restart. | **React Error Boundary** (<MFEErrorBoundary>) untuk mencegah *White Screen of Death*. |

---

## 2. Realitas "Satu Tab, Satu Runtime"

Di backend:
- Anda dapat mengisolasi Microservice Pembayaran di dalam container alpine dengan alokasi RAM 512MB.
- Microservice Pesanan berjalan di container berbeda dengan JVM sendiri.

Di browser:
- **TIDAK ADA Docker atau Node.js yang berjalan di dalam browser user.**
- Semua kode JavaScript yang diunduh dari Shell (port 5000) dan Child MFE (port 5006) dieksekusi di dalam **thread V8 Engine yang sama persis**.
- Inilah alasan mengapa dependensi inti (seperti React) harus dikelola secara ketat sebagai **Singleton**, karena jika tidak, dua copy library yang sama akan bertabrakan di dalam satu memori global.