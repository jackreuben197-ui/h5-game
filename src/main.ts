import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './bridge/bridge'
import './styles/main.scss'
import { setupRem } from './utils/rem'
import { pinia } from './stores/pinia'

setupRem()

const app = createApp(App)

app.use(pinia)
app.use(router)

app.mount('#app')
