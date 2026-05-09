import { useState, useEffect } from 'react';
import { useChat } from '@/context/ChatContext';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import styles from './ChatPage.module.css';

const ChatPage = () => {
  const { activeChat, closeChat } = useChat();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // On mobile: hide sidebar when chat is open
  const isMobile = window.innerWidth <= 768;
  const showSidebar = !isMobile || !activeChat;
  const showChat = !isMobile || !!activeChat;

  const handleBack = () => {
    closeChat();
    setSidebarOpen(true);
  };

  return (
    <div className={styles.layout}>
      {showSidebar && (
        <Sidebar
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((v) => !v)}
        />
      )}

      <main className={styles.main}>
        {showChat && activeChat ? (
          <ChatWindow
            chat={activeChat}
            onBack={isMobile ? handleBack : undefined}
          />
        ) : (
          <div className={styles.welcome}>
            <div className={styles.welcomeInner}>
              <span className={styles.welcomeIcon}>💬</span>
              <h2>Welcome to Chatter</h2>
              <p>Select a conversation or start a new one to begin messaging.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ChatPage;
