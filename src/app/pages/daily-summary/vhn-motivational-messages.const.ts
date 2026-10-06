export const VHN_MOTIVATIONAL_MESSAGES: string[] = [
  'Tuyệt vời! Bạn đã hoàn thành một ngày làm việc hiệu quả! 🎉',
  'Mỗi nhiệm vụ hoàn thành là một bước tiến. Chúc mừng bạn! 💪',
  'Ngày hôm nay đã được ghi lại trọn vẹn. Ngày mai hứa hẹn còn tốt hơn! ☀️',
  'Bạn đã nỗ lực hết mình! Hãy nghỉ ngơi thật thoải mái nhé. 🌙',
  'Một ngày làm việc đáng tự hào. Tiến độ đang rất tuyệt vời! 📈',
  'Công việc hôm nay: đã hoàn tất! Bạn thật xuất sắc. ⭐',
  'Từng bước nhỏ tích lũy thành công lớn. Cảm ơn vì hôm nay! 🚀',
];

export function getRandomMotivationalMessage(): string {
  return VHN_MOTIVATIONAL_MESSAGES[
    Math.floor(Math.random() * VHN_MOTIVATIONAL_MESSAGES.length)
  ];
}
