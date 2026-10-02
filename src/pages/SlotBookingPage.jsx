// src/pages/SlotBookingPage.jsx
import { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle2, Phone, Sparkles, User, Mail, MessageSquare, ChevronRight, X, AlertCircle, Scissors, Tag } from 'lucide-react';
import { subscribeToSlotCategories, subscribeToSlotBookings, saveSlotBookingToFirebase } from '../services/firebaseService';
import Footer from '../components/Footer';
import './SlotBookingPage.css';

// Operational Hours: 9:00 AM - 12:00 PM & 2:00 PM - 6:00 PM (30 min slots)
const MORNING_SLOTS = [
  '09:00 AM - 09:30 AM',
  '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM',
  '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM',
  '11:30 AM - 12:00 PM'
];

const AFTERNOON_SLOTS = [
  '02:00 PM - 02:30 PM',
  '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM',
  '03:30 PM - 04:00 PM',
  '04:00 PM - 04:30 PM',
  '04:30 PM - 05:00 PM',
  '05:00 PM - 05:30 PM',
  '05:30 PM - 06:00 PM'
];

const OUTFIT_STYLE_OPTIONS = [
  'Traditional Ethnic',
  'Western Couture',
  'Indo-Western Fusion'
];

const SLEEVE_OPTIONS = [
  'Sleeveless',
  'Half Sleeves',
  'Full Sleeves',
  'Cap / Bell Sleeves',
  'Designer Choice'
];

const NECKLINE_OPTIONS = [
  'Collar / High Neck',
  'Deep Neck',
  'Medium Length',
  'Off-Shoulder / Halter',
  'Designer Choice'
];

const SlotBookingPage = () => {
  const [categories, setCategories] = useState([]);
  const [existingBookings, setExistingBookings] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Booking Form State
  const [bookingDate, setBookingDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('');

  // Category Preference Questions State (Step 2)
  const [outfitStyle, setOutfitStyle] = useState(OUTFIT_STYLE_OPTIONS[0]);
  const [sleeveStyle, setSleeveStyle] = useState(SLEEVE_OPTIONS[0]);
  const [necklineStyle, setNecklineStyle] = useState(NECKLINE_OPTIONS[0]);
  const [eventDate, setEventDate] = useState('');

  // Contact Details State (Step 3)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [notes, setNotes] = useState('');
  
  // UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Date & Time, 2: Design Questions, 3: Contact Info, 4: Success
  const [submittedBooking, setSubmittedBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Subscribe to Categories and Existing Bookings
  useEffect(() => {
    const unsubCat = subscribeToSlotCategories((cats) => {
      setCategories(cats ? cats.filter(c => c.isActive !== false) : []);
    });
    const unsubBookings = subscribeToSlotBookings((bks) => {
      setExistingBookings(bks || []);
    });
    return () => {
      unsubCat();
      unsubBookings();
    };
  }, []);

  const openBookingModal = (category) => {
    setSelectedCategory(category);
    setBookingStep(1);
    setSelectedSlot('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedCategory(null);
    setSubmittedBooking(null);
  };

  // Get booked slots for the selected date
  const bookedSlotsForDate = existingBookings
    .filter(b => b.date === bookingDate && b.status !== 'Cancelled')
    .map(b => b.timeSlot);

  const isSlotBooked = (slot) => bookedSlotsForDate.includes(slot);

  const handleStep1Next = () => {
    if (!bookingDate) {
      setErrorMessage('Please select a booking date.');
      return;
    }
    if (!selectedSlot) {
      setErrorMessage('Please select a 30-minute time slot.');
      return;
    }
    setErrorMessage('');
    setBookingStep(2);
  };

  const handleStep2Next = () => {
    setErrorMessage('');
    setBookingStep(3);
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.replace(/\D/g, '').length < 10) {
      setErrorMessage('Please enter a valid 10-digit phone/WhatsApp number.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const bookingId = `SLOT-${Math.floor(1000 + Math.random() * 9000)}`;
    const newBooking = {
      id: bookingId,
      categoryId: selectedCategory?.id,
      categoryName: selectedCategory?.name || 'VIP Consultation',
      categoryPrice: selectedCategory?.price || 0,
      date: bookingDate,
      timeSlot: selectedSlot,
      outfitStyle,
      sleeveStyle,
      necklineStyle,
      eventDate: eventDate || 'Not specified',
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      notes: notes.trim(),
      status: 'Pending',
      createdAt: new Date().toISOString()
    };

    try {
      await saveSlotBookingToFirebase(newBooking);
      setSubmittedBooking(newBooking);
      setBookingStep(4);
    } catch (err) {
      setErrorMessage('Failed to save booking. Please try again or WhatsApp us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <main className="slot-booking-page">
        {/* Banner / Header */}
        <section className="slot-header">
          <div className="slot-header__inner">
            <span className="slot-header__badge">
              <Sparkles size={14} /> VIP Concierge Consultation
            </span>
            <h1 className="slot-header__title">Slot Booking</h1>
            <p className="slot-header__subtitle">
              Book a dedicated 30-minute 1-on-1 styling consultation with the DEVAKI design concierge team at your preferred time.
            </p>

            {/* Operating Hours Info Pill */}
            <div className="slot-header__hours-pill">
              <Clock size={15} color="var(--color-gold)" />
              <span>Available Daily: <strong>9:00 AM – 12:00 PM</strong> &amp; <strong>2:00 PM – 6:00 PM</strong> (30 Min Slots)</span>
            </div>
          </div>
        </section>

        {/* Slot Categories Grid */}
        <section className="slot-categories-section">
          <div className="slot-container">
            {categories.length === 0 ? (
              <div className="slot-empty">
                <p>No slot categories available at the moment. Please contact concierge via WhatsApp.</p>
              </div>
            ) : (
              <div className="slot-grid">
                {categories.map((cat) => (
                  <div key={cat.id} className="slot-card">
                    <div className="slot-card__image-wrap">
                      <img src={cat.image || 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80'} alt={cat.name} className="slot-card__img" />
                      <span className="slot-card__badge">
                        {cat.price > 0 ? `Fee: ₹${cat.price.toLocaleString('en-IN')}` : 'Complimentary'}
                      </span>
                    </div>

                    <div className="slot-card__content">
                      <h3 className="slot-card__title">{cat.name}</h3>
                      <p className="slot-card__tagline">{cat.tagline}</p>
                      {cat.description && (
                        <p className="slot-card__desc">{cat.description}</p>
                      )}

                      <div className="slot-card__footer">
                        <button
                          className="btn btn-gold slot-card__btn"
                          onClick={() => openBookingModal(cat)}
                        >
                          <Calendar size={15} />
                          <span>Book Time Slot</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ── Slot Booking Interactive Modal ────────────────── */}
      {isModalOpen && selectedCategory && (
        <div className="slot-modal-backdrop" onClick={closeModal}>
          <div className="slot-modal-content" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="slot-modal-header">
              <div style={{ flex: 1, minWidth: 0, paddingRight: '6px' }}>
                <span className="slot-modal-category">{selectedCategory.name}</span>
                <h2 className="slot-modal-title">
                  {bookingStep === 1 && 'Step 1: Date & Time'}
                  {bookingStep === 2 && 'Step 2: Style & Preferences'}
                  {bookingStep === 3 && 'Step 3: Contact Info'}
                  {bookingStep === 4 && 'Slot Confirmed!'}
                </h2>
              </div>
              <button className="slot-modal-close" onClick={closeModal} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            {/* Error Banner */}
            {errorMessage && (
              <div className="slot-error-banner">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Date & Time Selection */}
            {bookingStep === 1 && (
              <div className="slot-step-body">
                <div className="slot-form-group">
                  <label className="slot-label">
                    <Calendar size={15} color="var(--color-gold)" /> Select Booking Date
                  </label>
                  <input
                    type="date"
                    className="slot-input"
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      setBookingDate(e.target.value);
                      setSelectedSlot('');
                    }}
                  />
                </div>

                <div className="slot-time-section">
                  <label className="slot-label">
                    <Clock size={15} color="var(--color-gold)" /> Morning Sessions (9:00 AM – 12:00 PM)
                  </label>
                  <div className="slot-pills-grid">
                    {MORNING_SLOTS.map((slot) => {
                      const booked = isSlotBooked(slot);
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={booked}
                          className={`slot-pill ${isSelected ? 'slot-pill--active' : ''} ${booked ? 'slot-pill--disabled' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                          {booked && <span className="slot-pill__booked-tag">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="slot-time-section" style={{ marginTop: 'var(--sp-4)' }}>
                  <label className="slot-label">
                    <Clock size={15} color="var(--color-gold)" /> Afternoon Sessions (2:00 PM – 6:00 PM)
                  </label>
                  <div className="slot-pills-grid">
                    {AFTERNOON_SLOTS.map((slot) => {
                      const booked = isSlotBooked(slot);
                      const isSelected = selectedSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={booked}
                          className={`slot-pill ${isSelected ? 'slot-pill--active' : ''} ${booked ? 'slot-pill--disabled' : ''}`}
                          onClick={() => setSelectedSlot(slot)}
                        >
                          {slot}
                          {booked && <span className="slot-pill__booked-tag">Booked</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="slot-modal-actions">
                  <button className="btn btn-gold slot-next-btn" onClick={handleStep1Next}>
                    <span>Next Step →</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Touch-Friendly Style Preferences (Interactive Pills) */}
            {bookingStep === 2 && (
              <div className="slot-step-body">
                <div className="slot-summary-card">
                  <div className="slot-summary-row">
                    <span>Selected Slot:</span>
                    <strong style={{ color: 'var(--color-gold)' }}>{bookingDate} ({selectedSlot})</strong>
                  </div>
                </div>

                {/* Outfit Style Pills */}
                <div className="slot-form-group">
                  <label className="slot-label"><Scissors size={15} /> Preferred Outfit Style / Silhouette</label>
                  <div className="slot-options-flex">
                    {OUTFIT_STYLE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`slot-opt-badge ${outfitStyle === opt ? 'slot-opt-badge--active' : ''}`}
                        onClick={() => setOutfitStyle(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sleeve Style Pills */}
                <div className="slot-form-group">
                  <label className="slot-label"><Sparkles size={15} /> Sleeve Pattern Preference</label>
                  <div className="slot-options-flex">
                    {SLEEVE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`slot-opt-badge ${sleeveStyle === opt ? 'slot-opt-badge--active' : ''}`}
                        onClick={() => setSleeveStyle(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Neckline Style Pills (Collar, Deep Neck, Medium Length, Off-Shoulder, Designer Choice) */}
                <div className="slot-form-group">
                  <label className="slot-label"><Tag size={15} /> Neckline Preference</label>
                  <div className="slot-options-flex">
                    {NECKLINE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        className={`slot-opt-badge ${necklineStyle === opt ? 'slot-opt-badge--active' : ''}`}
                        onClick={() => setNecklineStyle(opt)}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wearing / Event Date */}
                <div className="slot-form-group">
                  <label className="slot-label"><Calendar size={15} /> Event / Wearing Date (Optional)</label>
                  <input
                    type="date"
                    className="slot-input"
                    value={eventDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEventDate(e.target.value)}
                  />
                </div>

                <div className="slot-modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setBookingStep(1)}>
                    ← Back
                  </button>
                  <button type="button" className="btn btn-gold slot-next-btn" onClick={handleStep2Next}>
                    <span>Next: Contact Details →</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Customer Contact Information */}
            {bookingStep === 3 && (
              <form className="slot-step-body" onSubmit={handleFinalSubmit}>
                <div className="slot-summary-card">
                  <div className="slot-summary-row">
                    <span>Category:</span>
                    <strong>{selectedCategory.name}</strong>
                  </div>
                  <div className="slot-summary-row">
                    <span>Slot:</span>
                    <strong style={{ color: 'var(--color-gold)' }}>{bookingDate} ({selectedSlot})</strong>
                  </div>
                  <div className="slot-summary-row">
                    <span>Preferences:</span>
                    <strong>{outfitStyle} · {necklineStyle}</strong>
                  </div>
                </div>

                <div className="slot-form-group">
                  <label className="slot-label"><User size={15} /> Your Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    className="slot-input"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className="slot-form-group">
                  <label className="slot-label"><Phone size={15} /> Phone / WhatsApp Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 9876543210"
                    className="slot-input"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                <div className="slot-form-group">
                  <label className="slot-label"><Mail size={15} /> Email Address (Optional)</label>
                  <input
                    type="email"
                    placeholder="name@example.com"
                    className="slot-input"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                  />
                </div>

                <div className="slot-form-group">
                  <label className="slot-label"><MessageSquare size={15} /> Special Requests / Design Notes (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Mention any custom fabric preferences, saree details, or special requests..."
                    className="slot-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="slot-modal-actions">
                  <button type="button" className="btn btn-ghost" onClick={() => setBookingStep(2)}>
                    ← Back
                  </button>
                  <button type="submit" disabled={isSubmitting} className="btn btn-gold slot-next-btn">
                    {isSubmitting ? 'Confirming Slot...' : 'Confirm Slot Booking'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 4: Success Screen */}
            {bookingStep === 4 && submittedBooking && (
              <div className="slot-step-body slot-success-view">
                <CheckCircle2 size={54} color="var(--color-gold)" style={{ margin: '0 auto' }} />
                <h3 className="slot-success-title">Slot Reserved Successfully!</h3>
                <p className="slot-success-ref">Booking Ref: <strong>#{submittedBooking.id}</strong></p>

                <div className="slot-summary-card" style={{ textAlign: 'left', marginTop: 'var(--sp-4)' }}>
                  <div className="slot-summary-row">
                    <span>Category:</span>
                    <strong>{submittedBooking.categoryName}</strong>
                  </div>
                  <div className="slot-summary-row">
                    <span>Selected Slot:</span>
                    <strong style={{ color: 'var(--color-gold)' }}>{submittedBooking.date} @ {submittedBooking.timeSlot}</strong>
                  </div>
                  <div className="slot-summary-row">
                    <span>Style &amp; Neckline:</span>
                    <strong>{submittedBooking.outfitStyle} ({submittedBooking.necklineStyle})</strong>
                  </div>
                  <div className="slot-summary-row">
                    <span>Name &amp; Phone:</span>
                    <strong>{submittedBooking.customerName} ({submittedBooking.customerPhone})</strong>
                  </div>
                </div>

                <p className="slot-success-note">
                  Our DEVAKI Concierge team will call or WhatsApp you directly at your booked 30-minute time slot.
                </p>

                <div className="slot-success-actions">
                  <a
                    href={`https://wa.me/918555074387?text=${encodeURIComponent(
                      `Hello DEVAKI Studio! I have booked a consultation slot (#${submittedBooking.id}) for ${submittedBooking.categoryName} on ${submittedBooking.date} at ${submittedBooking.timeSlot}.\nNeckline/Style: ${submittedBooking.necklineStyle} (${submittedBooking.outfitStyle}).\nCustomer Name: ${submittedBooking.customerName}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-gold"
                    style={{ gap: '8px', padding: '12px 20px', width: '100%', justifyContent: 'center' }}
                  >
                    <MessageSquare size={18} />
                    <span>Open WhatsApp Concierge Now</span>
                  </a>

                  <button className="btn btn-ghost" onClick={closeModal} style={{ width: '100%' }}>
                    Done &amp; Return to Page
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </>
  );
};

export default SlotBookingPage;
