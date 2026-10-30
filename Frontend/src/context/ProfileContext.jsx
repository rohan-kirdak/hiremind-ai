import React, { createContext, useContext, useState, useEffect } from 'react';

const ProfileContext = createContext(null);

const STORAGE_KEY = 'hiremind_candidate_profile';
const CONVERSATION_KEY = 'hiremind_conversation_id';

export const ProfileProvider = ({ children }) => {
  const [profile, setProfileState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [conversationId, setConversationIdState] = useState(() => {
    try {
      return localStorage.getItem(CONVERSATION_KEY) || null;
    } catch {
      return null;
    }
  });

  const setProfile = (newProfile) => {
    setProfileState(newProfile);
    try {
      if (newProfile) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newProfile));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to save profile to localStorage:', e);
    }
  };

  const setConversationId = (newId) => {
    setConversationIdState(newId);
    try {
      if (newId) {
        localStorage.setItem(CONVERSATION_KEY, newId);
      } else {
        localStorage.removeItem(CONVERSATION_KEY);
      }
    } catch (e) {
      console.warn('Failed to save conversationId to localStorage:', e);
    }
  };

  const clearProfile = () => {
    setProfile(null);
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        setProfile,
        clearProfile,
        conversationId,
        setConversationId,
        hasProfile: Boolean(profile && Array.isArray(profile.skills) && profile.skills.length > 0),
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};
