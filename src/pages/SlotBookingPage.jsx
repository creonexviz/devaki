// src/pages/SlotBookingPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar as CalendarIcon, Clock, Sparkles, CheckCircle2, ChevronRight, User, Phone, MessageSquare, ShieldCheck, Scissors, Crown, Layers } from 'lucide-react';
import {
  subscribeToBookingCategories,
  subscribeToSlotBookings,
  saveSlotBookingToFirebase
} from '../services/firebaseService';
import './SlotBookingPage.css';

// Helper to generate 30-min slots for 9am-12pm and 2pm-6pm
const MORNING_SLOTS = [
  '09:00 AM – 09:30 AM',
  '09:30 AM – 10:00 AM',
  '10:00 AM – 10:30 AM',
  '10:30 AM – 11:00 AM',
  '11:00 AM – 11:30 AM',
  '11:30 AM – 12:00 PM'
];

const AFTERNOON_SLOTS = [
  '02:00 PM – 02:30 PM',
  '02:30 PM – 03:00 PM',
  '03:00 PM – 03:30 PM',
  '03:30 PM – 04:00 PM',
  '04:00 PM – 04:30 PM',
  '04:30 PM – 05:00 PM',
  '05:00 PM – 05:30 PM',
  '05:30 PM – 06:00 PM'
];

const getCategoryIcon = (iconName) => {
  switch (iconName) {
    case 'Crown': return <Crown size={22} color="var(--color-gold)" />;
    case 'Scissors': return <Scissors size={22} color="var(--color-gold)" />;
    case 'Layers': return <Layers size={22} color="var(--color-gold)" />;
    default: return <Sparkles size={22} color="var(--color-gold)" />;
  }
};

const SlotBookingPage = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Date selection (default today YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const unsubCats = subscribeToBookingCategories((cats) => {
      setCategories(cats || []);
      if (cats && cats.length > 0 && !selectedCategory) {
        setSelectedCategory(cats[0]);
      }
    });

    const unsubBookings = subscribeToSlotBookings((bks) => {
      setAllBookings(bks || []);
    });

    return () => {
      unsubCats();
      unsubBookings();
    };
  }, []);

  // Filter already booked slots for the selected date
  const bookedSlotsForDate = allBookings
    .filter(b => b.date === selectedDate && b.status !== 'Cancelled')
    .map(b => b.slot);

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedSlot(null); // reset slot choice when date changes
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!selectedCategory) {
      setErrorMsg('Please select a consultation category.');
      return;
    }
    if (!selectedDate) {
      setErrorMsg('Please select a preferred date.');
      return;
    }
    if (!selectedSlot) {
      setErrorMsg('Please select an available 30-minute time slot.');
      return;
    }
    if (!name.trim() || !phone.trim()) {
      setErrorMsg('Please fill in your name and contact phone number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        category: selectedCategory.name,
        categoryId: selectedCategory.id,
        categoryFee: selectedCategory.fee,
        date: selectedDate,
        slot: selectedSlot,
        customerName: name.trim(),
        phone: phone.trim(),
        whatsapp: (whatsapp.trim() || phone.trim()),
        notes: notes.trim(),
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      const saved = await saveSlotBookingToFirebase(bookingData);
      setSubmittedBooking(saved);
    } catch (err) {
      console.error('Failed to save booking:', err);
      setErrorMsg('Failed to book slot. Please try again or contact support.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="slot-page">
      <div className="slot-container">
        
        {/* Header Title */}
        <div className="slot-header">
          <span className="slot-header__label">VIP CONSULTATION</span>
          <h1 className="slot-header__title">Book Your Personal Design Slot</h1>
          <p className="slot-header__desc">
            Reserve a dedicated 30-minute slot with DEVAKI studio designers. We will contact you directly to curate your dream outfit.
          </p>
        </div>

        {submittedBooking ? (
          /* Confirmation Screen */
          <div className="slot-success-card">
            <div className="slot-success-icon">
              <CheckCircle2 size={44} color="var(--color-gold)" />
            </div>
            <h2 className="slot-success-title">Slot Booking Confirmed!</h2>
            <p className="slot-success-sub">
              Your consultation booking ID is <strong style={{ color: 'var(--color-gold)' }}>#{submittedBooking.id}</strong>.
            </p>

            <div className="slot-summary-box">
              <div className="slot-summary-row">
                <span>Category:</span>
                <strong>{submittedBooking.category}</strong>
              </div>
              <div className="slot-summary-row">
                <span>Date:</span>
                <strong>{submittedBooking.date}</strong>
              </div>
              <div className="slot-summary-row">
                <span>Time Slot:</span>
                <strong style={{ color: 'var(--color-gold)' }}>{submittedBooking.slot}</strong>
              </div>
              <div className="slot-summary-row">
                <span>Customer:</span>
                <strong>{submittedBooking.customerName} ({submittedBooking.phone})</strong>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--sp-6)' }}>
              Our design team will reach out to you on WhatsApp / Phone during your selected 30-minute slot.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', alignItems: 'center' }}>
              <a
                href={`https://wa.me/918555074387?text=${encodeURIComponent(`Hi DEVAKI Studio, I booked a ${submittedBooking.category} slot (#${submittedBooking.id}) for ${submittedBooking.date} at ${submittedBooking.slot}. Name: ${submittedBooking.customerName}.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-gold"
                style={{ width: '100%', maxWidth: '360px', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <MessageSquare size={16} /> Confirm Booking on WhatsApp
              </a>

              <button
                className="btn btn-ghost"
                onClick={() => {
                  setSubmittedBooking(null);
                  setSelectedSlot(null);
                  setNotes('');
                }}
                style={{ fontSize: 'var(--text-xs)', color: 'var(--color-plum)' }}
              >
                Book Another Slot →
              </button>
            </div>
          </div>
        ) : (
          /* Main Booking Form */
          <form className="slot-form-layout" onSubmit={handleBookingSubmit}>
            
            {/* 1. Category Selection */}
            <section className="slot-section">
              <h2 className="slot-section__title">
                <span>1</span> Select Consultation Category
              </h2>
              <div className="slot-cat-grid">
                {categories.map(cat => (
                  <div
                    key={cat.id}
                    className={`slot-cat-card${selectedCategory?.id === cat.id ? ' slot-cat-card--selected' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    <div className="slot-cat-card__header">
                      {getCategoryIcon(cat.icon)}
                      <span className="slot-cat-card__fee">{cat.fee || 'Free'}</span>
                    </div>
                    <h3 className="slot-cat-card__title">{cat.name}</h3>
                    <p className="slot-cat-card__desc">{cat.description}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* 2. Date & Time Slot Selection */}
            <section className="slot-section">
              <h2 className="slot-section__title">
                <span>2</span> Choose Preferred Date &amp; 30-Min Time Slot
              </h2>
              
              <div className="slot-date-picker-wrapper">
                <label className="slot-label">
                  <CalendarIcon size={16} color="var(--color-gold)" /> Select Consultation Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="slot-input slot-date-input"
                  required
                />
              </div>

              {/* Morning Shift Slots */}
              <div className="slot-shift-box">
                <div className="slot-shift-header">
                  <Clock size={15} color="var(--color-gold)" /> Morning Shift (09:00 AM – 12:00 PM)
                </div>
                <div className="slot-grid">
                  {MORNING_SLOTS.map(slot => {
                    const isBooked = bookedSlotsForDate.includes(slot);
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        className={`slot-pill${isSelected ? ' slot-pill--selected' : ''}${isBooked ? ' slot-pill--booked' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                        {isBooked && <span className="slot-pill__status">Booked</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Afternoon Shift Slots */}
              <div className="slot-shift-box" style={{ marginTop: 'var(--sp-4)' }}>
                <div className="slot-shift-header">
                  <Clock size={15} color="var(--color-gold)" /> Afternoon &amp; Evening Shift (02:00 PM – 06:00 PM)
                </div>
                <div className="slot-grid">
                  {AFTERNOON_SLOTS.map(slot => {
                    const isBooked = bookedSlotsForDate.includes(slot);
                    const isSelected = selectedSlot === slot;
                    return (
                      <button
                        key={slot}
                        type="button"
                        disabled={isBooked}
                        className={`slot-pill${isSelected ? ' slot-pill--selected' : ''}${isBooked ? ' slot-pill--booked' : ''}`}
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {slot}
                        {isBooked && <span className="slot-pill__status">Booked</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 3. Customer Details */}
            <section className="slot-section">
              <h2 className="slot-section__title">
                <span>3</span> Enter Contact Information
              </h2>

              <div className="slot-fields-grid">
                <div className="slot-field">
                  <label className="slot-label">Full Name *</label>
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="slot-input"
                    required
                  />
                </div>

                <div className="slot-field">
                  <label className="slot-label">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="slot-input"
                    required
                  />
                </div>

                <div className="slot-field">
                  <label className="slot-label">WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="WhatsApp number for design updates"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    className="slot-input"
                  />
                </div>

                <div className="slot-field full-width">
                  <label className="slot-label">Outfit / Design Requirements (Optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Describe your outfit vision, event date, color preference, or saree transformation details..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="slot-input slot-textarea"
                  />
                </div>
              </div>
            </section>

            {errorMsg && (
              <div className="slot-error">
                {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <div className="slot-actions">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-gold slot-submit-btn"
              >
                {isSubmitting ? 'Reserving Your Slot...' : 'Confirm 30-Minute Slot Booking →'}
              </button>
              <div className="slot-guarantee">
                <ShieldCheck size={14} color="var(--color-gold)" /> Free cancellation anytime · Direct phone &amp; WhatsApp concierge
              </div>
            </div>
          </form>
        )}
      </div>
    </main>
  );
};

export default SlotBookingPage;
