// src/hooks/useVisitorTracking.js
import { useEffect } from 'react';
import { doc, getDoc, setDoc, increment, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

const getTodayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const useVisitorTracking = () => {
  useEffect(() => {
    const track = async () => {
      try {
        // Step 1: Ensure visitor has a UUID
        let visitorId = localStorage.getItem('devaki_visitor_id');
        if (!visitorId) {
          visitorId = generateUUID();
          localStorage.setItem('devaki_visitor_id', visitorId);
        }

        // Step 2: Check if already counted today
        const todayKey = getTodayKey();
        const lastVisitDate = localStorage.getItem('devaki_last_visit_date');
        if (lastVisitDate === todayKey) return; // Already counted today — skip

        // Step 3: Atomic increment in Firestore
        const dailyRef = doc(db, 'visitors', todayKey);
        const dailySnap = await getDoc(dailyRef);

        if (dailySnap.exists()) {
          await updateDoc(dailyRef, { count: increment(1) });
        } else {
          await setDoc(dailyRef, { date: todayKey, count: 1 });
        }

        // Also update all-time total
        const allTimeRef = doc(db, 'visitors', 'all_time');
        const allTimeSnap = await getDoc(allTimeRef);
        if (allTimeSnap.exists()) {
          await updateDoc(allTimeRef, { total: increment(1) });
        } else {
          await setDoc(allTimeRef, { total: 1 });
        }

        // Step 4: Mark today as visited in localStorage
        localStorage.setItem('devaki_last_visit_date', todayKey);
      } catch (err) {
        // Silently fail — visitor tracking should never break the store
        console.warn('Visitor tracking error:', err);
      }
    };

    track();
  }, []);
};
