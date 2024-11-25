import AppLayout from '@/layout/AppLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {
            path: '/',
            name: 'RTMP converter',
            component: () => import('@/views/pages/Main.vue'),
            params: true
        },
        {
            path: '/:session',
            name: 'Stream',
            component: () => import('@/views/pages/Empty.vue'),
            params: true
        }
    ]
});

export default router;
