<template>
  <nav class="bg-slate-900 text-white px-4 py-3 shadow-md">
  <div class="max-w-6xl mx-auto flex items-center justify-between">

    <!-- LEFT -->
    <div class="flex items-center gap-3">
      <img src="../assets/Fail2ban_logo.png" class="w-8 h-8" />

      <span class="font-bold text-lg">
        Fail2Ban Panel
      </span>
    </div>

    <!-- CENTER (MENU) -->
    <div class="hidden md:flex items-center gap-2">
      
      <button class="nav-btn active">
        📊 Dashboard
      </button>

      <button class="nav-btn">
        🔒 Jails
        <span class="badge">12</span>
      </button>

      <button class="nav-btn">
        🚨 Alertas
        <span class="badge-red">3</span>
      </button>

      <button class="nav-btn">
        ⚙️ Config
      </button>
    </div>

    <!-- RIGHT -->
    <div class="flex items-center gap-2">
      <button class="refresh-btn">
        🔄
      </button>

      <!-- mobile menu button -->
      <button class="md:hidden">
        ☰
      </button>
    </div>

  </div>
</nav>  
</template>
<style scoped>
.nav-btn {
  @apply px-3 py-1 rounded-lg text-sm hover:bg-slate-700 transition;
}

.nav-btn.active {
  @apply bg-blue-600;
}

.badge {
  @apply ml-2 bg-slate-700 text-xs px-2 py-0.5 rounded-full;
}

.badge-red {
  @apply ml-2 bg-red-600 text-xs px-2 py-0.5 rounded-full;
}

.refresh-btn {
  @apply bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded-lg;
}
</style>