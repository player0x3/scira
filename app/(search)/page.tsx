"use client";

import { Suspense } from 'react';
import { ChatInterface } from '@/components/aichat/chat-interface';
import { InstallPrompt } from '@/components/InstallPrompt';

const Home = () => {
    return (
        <Suspense>
            <ChatInterface  />
            <InstallPrompt />
        </Suspense>
    );
};

export default Home;