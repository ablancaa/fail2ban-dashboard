<template>
  <nav class="bg-slate-900 text-white px-4 py-3 shadow-md">
  <div class="max-w-6xl mx-auto flex items-center justify-between">

    <!-- LEFT -->
    <div class="flex items-center gap-3">
      <img src="/logo.png" class="w-8 h-8" />

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