'use strict';

/**
 * HireMind AI — Simple Conversation History Service
 *
 * Implements lightweight conversation persistence without complex memory frameworks
 * or vector databases. Persists messages, timestamps, and active candidate profile
 * to a local storage file with an in-memory cache.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dataDir = path.resolve(__dirname, '../../data');
const storageFile = path.join(dataDir, 'conversations.json');

// In-memory cache: Map<conversationId, conversationObject>
const cache = new Map();
let isInitialized = false;

function ensureDataDirectory() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadFromDisk() {
  if (isInitialized) return;
  ensureDataDirectory();

  try {
    if (fs.existsSync(storageFile)) {
      const raw = fs.readFileSync(storageFile, 'utf8');
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        for (const item of data) {
          if (item && item.conversationId) {
            cache.set(item.conversationId, item);
          }
        }
      }
    }
  } catch (error) {
    console.error(`[conversation.service] Error reading conversations from disk: ${error.message}`);
  }

  isInitialized = true;
}

function saveToDisk() {
  ensureDataDirectory();
  try {
    const data = Array.from(cache.values());
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`[conversation.service] Error saving conversations to disk: ${error.message}`);
  }
}

/**
 * Retrieve or initialize a conversation.
 *
 * @param {string} [conversationId]
 * @param {string} [userId='anonymous']
 * @returns {object} Conversation record
 */
function getConversation(conversationId, userId = 'anonymous') {
  loadFromDisk();

  const id = conversationId && typeof conversationId === 'string' && conversationId.trim()
    ? conversationId.trim()
    : crypto.randomUUID();

  if (cache.has(id)) {
    return cache.get(id);
  }

  const newConv = {
    conversationId: id,
    userId: userId || 'anonymous',
    candidateProfile: null,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  cache.set(id, newConv);
  saveToDisk();
  return newConv;
}

/**
 * Record a new message in conversation history.
 *
 * @param {string} conversationId
 * @param {object} message
 * @param {string} message.role - 'user' | 'assistant' | 'system'
 * @param {string} message.content - Text content
 * @param {object} [message.metadata] - Optional metadata (e.g. tool results, agent handoffs)
 * @returns {object} The appended message
 */
function addMessage(conversationId, { role, content, metadata = null }) {
  const conv = getConversation(conversationId);

  const entry = {
    id: crypto.randomUUID(),
    role: role === 'assistant' || role === 'model' ? 'model' : 'user',
    content: String(content || '').trim(),
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };

  conv.messages.push(entry);
  conv.updatedAt = new Date().toISOString();

  saveToDisk();
  return entry;
}

/**
 * Attach or update the candidate profile associated with the conversation.
 *
 * @param {string} conversationId
 * @param {object} candidateProfile
 */
function updateCandidateProfile(conversationId, candidateProfile) {
  if (!candidateProfile || typeof candidateProfile !== 'object') return;
  const conv = getConversation(conversationId);
  conv.candidateProfile = candidateProfile;
  conv.updatedAt = new Date().toISOString();
  saveToDisk();
}

/**
 * Format recent messages for Gemini multi-turn dialogue context.
 *
 * @param {string} conversationId
 * @param {number} [maxMessages=6]
 * @returns {Array<object>} Array of Gemini contents format
 */
function getRecentHistory(conversationId, maxMessages = 6) {
  const conv = getConversation(conversationId);
  const recent = conv.messages.slice(-maxMessages);

  return recent.map((m) => ({
    role: m.role === 'model' || m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

/**
 * Reset conversation history.
 *
 * @param {string} conversationId
 */
function clearConversation(conversationId) {
  loadFromDisk();
  if (cache.has(conversationId)) {
    cache.delete(conversationId);
    saveToDisk();
  }
}

module.exports = {
  getConversation,
  addMessage,
  updateCandidateProfile,
  getRecentHistory,
  clearConversation,
};

