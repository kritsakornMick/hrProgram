/** รูปแบบผลลัพธ์ของ Server Action ทุกตัว ให้หน้าเว็บแสดงข้อความได้แบบเดียวกัน */
export type ActionResult<T = undefined> =
  | { ok: true; data?: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[] | undefined> }
