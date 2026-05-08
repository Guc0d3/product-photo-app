export const translations = {
  th: {
    // App
    appName: 'รับสินค้า',
    appSubtitle: 'ระบบบันทึกภาพสินค้า',

    // Login
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    emailPlaceholder: 'example@company.com',
    passwordPlaceholder: '••••••••',
    login: 'เข้าสู่ระบบ',
    loggingIn: 'กำลังเข้าสู่ระบบ...',

    // Queue List
    queueListTitle: 'ใบรับสินค้า',
    searchPlaceholder: 'ค้นหาใบรับสินค้า, คิว...',
    filterAll: 'ทั้งหมด',
    filterOpen: 'กำลังดำเนินการ',
    filterClosed: 'เสร็จแล้ว',
    statusOpen: 'กำลังดำเนินการ',
    statusClosed: 'เสร็จแล้ว',
    noQueues: 'ไม่พบใบรับสินค้า',
    receiptNo: 'เลขที่',

    // New Queue Modal
    newQueueTitle: 'สร้างใบรับสินค้าใหม่',
    autoCode: 'เลขที่ใบรับสินค้า (Auto)',
    queueLabel: 'คิว',
    queueHint: '(0-9, . , - +)',
    queuePlaceholder: 'เช่น 1, 2, 3 หรือ 1.1',
    queueRequired: 'กรุณาระบุหมายเลขคิว',
    queueInvalid: 'ใส่ได้เฉพาะตัวเลข 0-9 และ . , - +',
    supplierLabel: 'ชื่อผู้จำหน่าย',
    supplierPlaceholder: 'เช่น บริษัท ABC จำกัด',
    noteLabel: 'หมายเหตุ',
    notePlaceholder: 'หมายเหตุเพิ่มเติม...',
    createQueue: 'สร้างใบรับสินค้า',
    pinned: 'ปักหมุด',

    // Queue Detail
    closeQueue: 'ปิดคิว',
    untaggedCount: (n) => `${n} ยังไม่ระบุ`,
    totalPhotos: (n) => `${n} รูปทั้งหมด`,
    taggedCount: (n) => `${n} ระบุแล้ว`,
    untaggedWarning: (n) => `${n} ยังไม่ระบุ`,
    groupByType: 'แยกประเภท',
    imagesGroup: (n) => `รูปภาพ (${n})`,
    videosGroup: (n) => `วิดีโอ (${n})`,
    videoExpiry: (n) => `หมดอายุใน ${n} วัน`,
    videoExpiryLabel: (n) => `• หมดอายุใน ${n} วัน`,
    videoExpired: 'VDO หมดอายุแล้ว',
    videoExpiresIn: (n) => `VDO หมดอายุใน ${n} วัน`,
    permissionNotice: 'แก้ไขได้เฉพาะรูปที่ถ่ายวันนี้เท่านั้น',
    noMedia: 'ยังไม่มีสื่อ',
    noMediaHint: 'กดปุ่มกล้องเพื่อเริ่มถ่าย',
    notTagged: 'ยังไม่ระบุ',
    noType: 'ไม่มีชนิด',
    expired: 'หมดอายุ',

    // Product Type Modal
    selectProductType: 'เลือกชนิดสินค้า',
    takenAt: (t) => `ถ่ายเมื่อ ${t}`,
    searchProductType: 'ค้นหาชนิดสินค้า...',
    noProductTypeFound: 'ไม่พบชนิดสินค้า',
    save: 'บันทึก',
    editType: 'แก้ไขชนิด',

    // Full Preview
    deletePhoto: 'ลบรูปภาพนี้?',
    deleteVideo: 'ลบวิดีโอนี้?',
    deleteHint: (t) => `ถ่ายเมื่อ ${t} · ไม่สามารถกู้คืนได้`,
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    notTaggedFull: 'ยังไม่ระบุชนิดสินค้า',

    // Close Queue
    closeQueueTitle: 'ปิดคิวนี้?',
    closeQueueBodyUntagged: (n) => `ยังมี ${n} รูปที่ยังไม่ระบุชนิดสินค้า ต้องการปิดคิวหรือไม่?`,
    closeQueueBody: 'ต้องการปิดใบรับสินค้านี้?',
    closeQueueHint: (admin) => `สามารถกลับมาแก้ไขได้ภายหลัง${!admin ? ' (ภายในวันนี้)' : ''}`,
    confirmClose: 'ปิดคิว',

    // Camera
    reviewPhoto: 'ตรวจสอบรูป',
    retake: 'ถ่ายใหม่',
    usePhoto: 'ใช้รูปนี้',
    cameraHint: 'คุณสามารถเลือกชนิดสินค้าได้ทีหลังในหน้าใบรับสินค้า',

    // Relative time
    justNow: 'เพิ่งสร้าง',
    minutesAgo: (n) => `${n} นาทีที่แล้ว`,
    hoursAgo: (n) => `${n} ชั่วโมงที่แล้ว`,
    yesterday: 'เมื่อวาน',
    daysAgo: (n) => `${n} วันที่แล้ว`,

    // Empty state
    selectQueueHint: 'เลือกใบรับสินค้า',
    selectQueueSubHint: 'เพื่อดูรูปภาพและวิดีโอ',
  },

  en: {
    // App
    appName: 'Goods Receipt',
    appSubtitle: 'Product Photo Logger',

    // Login
    email: 'Email',
    password: 'Password',
    emailPlaceholder: 'example@company.com',
    passwordPlaceholder: '••••••••',
    login: 'Sign In',
    loggingIn: 'Signing in...',

    // Queue List
    queueListTitle: 'Receipts',
    searchPlaceholder: 'Search receipt, queue...',
    filterAll: 'All',
    filterOpen: 'In Progress',
    filterClosed: 'Completed',
    statusOpen: 'In Progress',
    statusClosed: 'Completed',
    noQueues: 'No receipts found',
    receiptNo: 'No.',

    // New Queue Modal
    newQueueTitle: 'New Goods Receipt',
    autoCode: 'Receipt No. (Auto)',
    queueLabel: 'Queue',
    queueHint: '(0-9, . , - +)',
    queuePlaceholder: 'e.g. 1, 2, 3 or 1.1',
    queueRequired: 'Please enter a queue number',
    queueInvalid: 'Only 0-9 and . , - + allowed',
    supplierLabel: 'Supplier',
    supplierPlaceholder: 'e.g. ABC Co., Ltd.',
    noteLabel: 'Note',
    notePlaceholder: 'Additional notes...',
    createQueue: 'Create Receipt',
    pinned: 'Pinned',

    // Queue Detail
    closeQueue: 'Close',
    untaggedCount: (n) => `${n} untagged`,
    totalPhotos: (n) => `${n} total`,
    taggedCount: (n) => `${n} tagged`,
    untaggedWarning: (n) => `${n} untagged`,
    groupByType: 'Group by type',
    imagesGroup: (n) => `Photos (${n})`,
    videosGroup: (n) => `Videos (${n})`,
    videoExpiry: (n) => `Expires in ${n}d`,
    videoExpiryLabel: (n) => `• Expires in ${n} days`,
    videoExpired: 'Video expired',
    videoExpiresIn: (n) => `Video expires in ${n} days`,
    permissionNotice: "You can only edit today's photos",
    noMedia: 'No media yet',
    noMediaHint: 'Tap the camera button to start',
    notTagged: 'Untagged',
    noType: 'No type',
    expired: 'Expired',

    // Product Type Modal
    selectProductType: 'Select Product Type',
    takenAt: (t) => `Taken at ${t}`,
    searchProductType: 'Search product type...',
    noProductTypeFound: 'No product type found',
    save: 'Save',
    editType: 'Edit Type',

    // Full Preview
    deletePhoto: 'Delete this photo?',
    deleteVideo: 'Delete this video?',
    deleteHint: (t) => `Taken at ${t} · Cannot be undone`,
    cancel: 'Cancel',
    delete: 'Delete',
    notTaggedFull: 'Product type not set',

    // Close Queue
    closeQueueTitle: 'Close this queue?',
    closeQueueBodyUntagged: (n) => `${n} photo(s) still untagged. Close anyway?`,
    closeQueueBody: 'Close this goods receipt?',
    closeQueueHint: (admin) => `You can edit later${!admin ? ' (today only)' : ''}`,
    confirmClose: 'Close Queue',

    // Camera
    reviewPhoto: 'Review Photo',
    retake: 'Retake',
    usePhoto: 'Use Photo',
    cameraHint: 'You can set the product type later in the receipt view',

    // Relative time
    justNow: 'Just created',
    minutesAgo: (n) => `${n} min ago`,
    hoursAgo: (n) => `${n} hr ago`,
    yesterday: 'Yesterday',
    daysAgo: (n) => `${n} days ago`,

    // Empty state
    selectQueueHint: 'Select a receipt',
    selectQueueSubHint: 'to view its photos and videos',
  },
}
