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
                    🔒 Jails activas
                    <span class="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {{ store.activeJails }}
                    </span>
                </button>

                <button class="nav-btn">
                    🚨 Alertas
                    <span v-if="store.alerts > 0" class="ml-2 bg-red-500 px-2 rounded text-xs">
                        {{ store.alerts }}
                    </span>
                </button>

                <button class="nav-btn">
                    ⚙️ Config
                </button>
            </div>

            <!-- RIGHT -->
            <div class="flex items-center gap-2">
                <button class="ml-auto bg-blue-600 px-3 py-1 rounded"
                    @click="store.refresh">
                    🔄 Refresh
                </button>

                <!-- mobile menu button -->
                <button class="md:hidden">
                    ☰
                </button>
            </div>

        </div>
    </nav>
</template>
<script setup>
import { ref, onMounted, computed } from 'vue'
import { useFail2BanStore } from '../stores/fail2ban'

const store = useFail2BanStore()
const props = defineProps({
  jails: {
    type: Array,
    default: () => []
  }
})

onMounted(() => {
    fetchJailsCount()
    setInterval(fetchJailsCount, 10000)
})

const activeJails = computed(() => {
  return props.jails.length
})

const jailsCount = ref(0)

// const activeJails = computed(() => {
//   return jails.value.filter(j =>
//     j.jail &&
//     !j.error &&
//     typeof j.bannedCount === 'number'
//   ).length
// })

//console.log(jails.value)

const fetchJailsCount = async () => {
    try {
        const res = await axios.get('http://192.168.1.137:3000/api/jails-count')
        jailsCount.value = res.data.count
    } catch (e) {
        jailsCount.value = 0
    }
}

</script>
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