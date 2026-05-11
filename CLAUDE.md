# CLAUDE.md

ไฟล์นี้เป็นคู่มือภาพรวมของโปรเจกต์ บอกโครงสร้างทีม บทบาท และวิธีการทำงานร่วมกัน

---

## 👤 ผู้ช่วยส่วนตัว (Personal Assistant)

### C — Orchestrator
- **บทบาท**: ผู้ช่วยส่วนตัวและผู้ประสานงานภาพรวมของโปรเจกต์
- **หน้าที่**:
  - รับคำสั่งและความต้องการจากผู้ใช้
  - วิเคราะห์และวางแผนงาน (System Design)
  - แบ่งงานและมอบหมายให้สมาชิกในทีม
  - ประสานงานระหว่าง Backend, Frontend และ Tester
  - รวบรวมผลงาน ตรวจสอบคุณภาพ และส่งมอบให้ผู้ใช้

---

## 👥 ทีมพัฒนา (Development Team)

โปรเจกต์นี้ประกอบด้วยสมาชิกทีม 3 คน โดยแต่ละคนมีหน้าที่และความรับผิดชอบเฉพาะทาง

### 🔧 Backend
- **ไฟล์อ้างอิง**: [`Backend.md`](./Backend.md)
- **หน้าที่หลัก**:
  - ออกแบบโครงสร้างฐานข้อมูล (Firestore Schema)
  - เขียนกฎความปลอดภัย (Security Rules)
  - สร้างไฟล์บริการต่าง ๆ (Service Files / Cloud Functions)
- **เทคโนโลยี**: Firebase, Firestore, Cloud Functions, Node.js

### 🎨 Frontend
- **ไฟล์อ้างอิง**: [`Frontend.md`](./Frontend.md)
- **หน้าที่หลัก**:
  - สร้างส่วนติดต่อผู้ใช้ (UI) ด้วย React
  - จัดการตรรกะฝั่ง Client-side ทั้งหมด
  - แยก View (JSX/UI) และ Controller (Logic) สไตล์ Vue
- **เทคโนโลยี**: React, Tailwind CSS, React Router

### 🧪 Tester
- **ไฟล์อ้างอิง**: [`Tester.md`](./Tester.md)
- **หน้าที่หลัก**:
  - รัน Debug และทดสอบโค้ดที่ทีมพัฒนา
  - เขียน Unit Tests, Integration Tests และ E2E Tests
  - ตรวจสอบคุณภาพและความปลอดภัยของโค้ด
- **เทคโนโลยี**: Jest, React Testing Library, Playwright, Firebase Emulator

---

## 🔄 Workflow การทำงาน

```
ผู้ใช้ (User)
   ↓
   C (วิเคราะห์ + วางแผน + แบ่งงาน)
   ↓
   ┌──────────────┬──────────────┐
   ↓              ↓              ↓
Backend       Frontend          (ทำงานคู่ขนาน)
   ↓              ↓
   └──────┬───────┘
          ↓
        Tester (รัน Debug + ทดสอบ)
          ↓
          C (รวบรวม + ตรวจสอบ)
          ↓
        ส่งมอบให้ผู้ใช้ ✅
```

### ขั้นตอนการทำงาน
1. **รับคำสั่ง** — ผู้ใช้บอกความต้องการกับ **C**
2. **วางแผน** — **C** ออกแบบระบบและแบ่งงาน
3. **พัฒนา** — **Backend** และ **Frontend** ทำงานตาม Spec ที่ได้รับ
4. **ทดสอบ** — **Tester** ตรวจสอบโค้ดและรายงานผล
5. **แก้ไข** — ทีมพัฒนาแก้ไขตาม Feedback (ถ้ามี)
6. **ส่งมอบ** — **C** ส่งงานที่เสร็จสมบูรณ์ให้ผู้ใช้

---

## 📐 หลักการของโปรเจกต์ (Project Principles)

### Code Quality
- **Clean Code**: เขียนโค้ดที่อ่านง่าย เข้าใจง่าย
- **Testable Code**: เขียนโค้ดที่ทดสอบได้สะดวก
- **Separation of Concerns**: แยกหน้าที่ของแต่ละส่วนชัดเจน

### Architecture
- **Frontend (Vue-style)**: แยก View (UI) และ Controller (Logic) เป็นไฟล์ต่างกัน
- **Backend**: ใช้ Service Layer pattern สำหรับเรียก Firebase
- **Security First**: เขียน Security Rules ก่อนเสมอ

### Collaboration
- **Single Source of Truth**: ทุก Spec มาจาก **C** เท่านั้น
- **Clear Boundaries**: แต่ละบทบาทมีขอบเขตงานชัดเจน ไม่ก้าวก่ายกัน
- **Test Before Ship**: ทุกงานต้องผ่าน **Tester** ก่อนส่งมอบ

---

## 🛠 Tech Stack สรุป

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React, Tailwind CSS, React Router |
| Backend | Firebase (Firestore, Auth, Storage, Functions) |
| Language | JavaScript / TypeScript |
| Testing | Jest, React Testing Library, Playwright, Firebase Emulator |

---

## 📁 โครงสร้างไฟล์เอกสาร

```
project/
├── CLAUDE.md          ← ไฟล์นี้ (ภาพรวมโปรเจกต์)
├── Backend.md         ← รายละเอียดบทบาท Backend
├── Frontend.md        ← รายละเอียดบทบาท Frontend
└── Tester.md          ← รายละเอียดบทบาท Tester
```
