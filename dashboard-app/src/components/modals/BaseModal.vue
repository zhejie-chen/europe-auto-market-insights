<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm" @click.self="closeModal">
        <div class="bg-white w-11/12 max-w-6xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
          
          <div class="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
            <div>
              <h3 class="text-xl font-bold text-slate-800">{{ title }}</h3>
              <p class="text-sm text-slate-500 mt-1">{{ subtitle }}</p>
            </div>
            <button @click="closeModal" class="text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 p-2 rounded-full transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>

          <div class="p-6 h-[500px]">
            <slot></slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
defineProps({ isOpen: Boolean, title: String, subtitle: String })
const emit = defineEmits(['close'])
const closeModal = () => emit('close')
</script>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.modal-enter-from, .modal-leave-to { opacity: 0; }
.animate-scale-up { animation: scaleUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
@keyframes scaleUp {
  from { transform: scale(0.95) translateY(10px); opacity: 0; }
  to { transform: scale(1) translateY(0); opacity: 1; }
}
</style>