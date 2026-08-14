// ============================================
// 唯一需要经常改的文件
// ============================================
const CONFIG = {
  siteTitle: "篝火旁",
  friendName: "W",   
  myName: "M",  

  greeting: "推开这扇夜色，篝火一直在这儿等你。",

  // Supabase 项目配置
  supabaseUrl: "https://hqaizhpmbyotnphyzfbj.supabase.co/rest/v1/",
  supabaseAnonKey: "sb_publishable_Z5VwMxgAkbDAXp7rPxm9OA_L6Csz7Tj",
  storageBucket: "media",

  // 可点的表情反应
  reactions: ["🔥", "❤️", "😂", "😮", "🥺"],

  // 小屋窗户点开后展示的相册：发照片时标了这个词，就会出现在这里
  windowTag: "风景",
};

window.CONFIG = CONFIG;
