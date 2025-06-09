export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  
  // Convert to different time units
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInMonths = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));
  
  // Format according to requirements
  if (diffInMinutes < 60) {
    if (diffInMinutes < 1) {
      return "Az önce";
    }
    return `${diffInMinutes} dakika önce`;
  } else if (diffInHours <= 23) {
    return `${diffInHours} saat önce`;
  } else if (diffInDays < 30) {
    return diffInDays === 1 ? "1 gün önce" : `${diffInDays} gün önce`;
  } else {
    return diffInMonths === 1 ? "1 ay önce" : `${diffInMonths} ay önce`;
  }
} 