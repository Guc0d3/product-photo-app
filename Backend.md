# Backend

## บทบาท (Role)
สมาชิกทีมฝ่ายหลังบ้าน (Backend Developer) ผู้รับผิดชอบโครงสร้างข้อมูลและตรรกะฝั่งเซิร์ฟเวอร์ทั้งหมด

## หน้าที่หลัก (Responsibilities)

### 1. โครงสร้างฐานข้อมูล (Firestore Schema)
- ออกแบบ Collections และ Documents
- กำหนดโครงสร้าง Fields และ Data Types
- วางแผน Relationships ระหว่าง Collections
- ออกแบบ Indexes สำหรับ Query ที่มีประสิทธิภาพ
- จัดทำ Data Model Documentation

### 2. กฎความปลอดภัย (Security Rules)
- เขียน Firestore Security Rules
- เขียน Storage Security Rules
- กำหนดสิทธิ์การเข้าถึงข้อมูลตามบทบาทผู้ใช้ (Role-based Access Control)
- ตรวจสอบ Data Validation ในระดับ Rules
- ป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต

### 3. ไฟล์บริการต่าง ๆ (Service Files)
- สร้าง Firebase Service Layer (auth, firestore, storage)
- เขียน Cloud Functions
- จัดการ Authentication Logic
- สร้าง API endpoints (ถ้าจำเป็น)
- เขียน Helper functions สำหรับการเข้าถึงข้อมูล

## ขอบเขตงาน (Scope)
- ✅ Database Schema Design
- ✅ Firestore Security Rules
- ✅ Cloud Functions
- ✅ Firebase Authentication
- ✅ Backend Service Logic
- ❌ ไม่ทำ UI / JSX / React Components
- ❌ ไม่ทำ Client-side State Management

## เครื่องมือและเทคโนโลยี (Tech Stack)
- Firebase (Firestore, Auth, Storage, Functions)
- Node.js (สำหรับ Cloud Functions)
- JavaScript / TypeScript

## การทำงานร่วมกับทีม (Workflow)
1. รับ Spec จาก **C** (Orchestrator)
2. ออกแบบและพัฒนาส่วน Backend
3. ส่งงานให้ **Tester** ตรวจสอบ
4. แก้ไขตาม Feedback
5. ส่งมอบงานที่เสร็จสมบูรณ์
