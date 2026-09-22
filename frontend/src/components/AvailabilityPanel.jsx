import { useState } from "react";
import { CalendarDays, Users, Search, LoaderCircle, AlertCircle, CheckCircle2, X } from "lucide-react";
import { checkAvailability } from "../api";
import RoomCard from "./RoomCard";

export default function AvailabilityPanel() {
  const [form, setForm] = useState({
    checkIn: "",
    checkOut: "",
    adults: 2
  });
  const [state, setState] = useState({ loading: false, error: "", data: null });
  const [selectedRoom, setSelectedRoom] = useState(null);

  function selectRoom(room) {
    // No real booking/payment backend exists for this demo, so selecting a
    // room records the choice locally and shows a confirmation instead of
    // silently doing nothing.
    setSelectedRoom(room);
  }

  function update(name, value) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function submit(event) {
    event.preventDefault();

    if (!form.checkIn || !form.checkOut) {
      setState({ loading: false, error: "Please select both dates.", data: null });
      return;
    }

    if (form.checkOut <= form.checkIn) {
      setState({ loading: false, error: "Check-out must be after check-in.", data: null });
      return;
    }

    setState({ loading: true, error: "", data: null });
    setSelectedRoom(null);

    try {
      const result = await checkAvailability({
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        adults: Number(form.adults)
      });

      setState({ loading: false, error: "", data: result.data });
    } catch (error) {
      setState({ loading: false, error: error.message, data: null });
    }
  }

  return (
    <section className="availability-section" id="availability">
      <div className="section-title-row">
        <div>
          <span className="eyebrow">ROOMS</span>
          <h2>Find your perfect stay</h2>
          <p>Check live-style demo availability for your dates.</p>
        </div>
        <div className="section-icon"><Search size={20} /></div>
      </div>

      <form className="availability-form" onSubmit={submit}>
        <label>
          <span><CalendarDays size={16} /> Check-in</span>
          <input type="date" value={form.checkIn} onChange={e => update("checkIn", e.target.value)} />
        </label>

        <label>
          <span><CalendarDays size={16} /> Check-out</span>
          <input type="date" value={form.checkOut} onChange={e => update("checkOut", e.target.value)} />
        </label>

        <label>
          <span><Users size={16} /> Guests</span>
          <select value={form.adults} onChange={e => update("adults", e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <option value={n} key={n}>{n} Guest{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </label>

        <button className="primary-button availability-button" disabled={state.loading}>
          {state.loading ? <><LoaderCircle className="spin" size={17} /> Checking...</> : <>Check Availability</>}
        </button>
      </form>

      {state.error && (
        <div className="inline-error">
          <AlertCircle size={18} />
          <div><strong>Unable to check availability</strong><p>{state.error}</p></div>
        </div>
      )}

      {state.data && (
        <div className="results">
          <div className="results-heading">
            <div>
              <h3>{state.data.rooms.length ? "Available rooms" : "No rooms available"}</h3>
              <p>{state.data.checkIn} → {state.data.checkOut} · {state.data.adults} guest{state.data.adults > 1 ? "s" : ""}</p>
            </div>
            <span>{state.data.nights} night{state.data.nights > 1 ? "s" : ""}</span>
          </div>

          {selectedRoom && (
            <div className="booking-confirmation">
              <CheckCircle2 size={18} />
              <div>
                <strong>Room selected: {selectedRoom.name}</strong>
                <p>
                  ₹{selectedRoom.totalPrice.toLocaleString("en-IN")} total for {state.data.nights} night
                  {state.data.nights > 1 ? "s" : ""}, {state.data.checkIn} → {state.data.checkOut}.
                  This is a demo — no real booking or payment is made. Our team would follow up to confirm.
                </p>
              </div>
              <button
                type="button"
                className="confirmation-dismiss"
                onClick={() => setSelectedRoom(null)}
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>
            </div>
          )}

          {state.data.rooms.length ? (
            <div className="room-list">
              {state.data.rooms.map(room => (
                <RoomCard
                  key={room.id}
                  room={room}
                  nights={state.data.nights}
                  selected={selectedRoom?.id === room.id}
                  onSelect={selectRoom}
                />
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <div className="empty-icon">🏨</div>
              <h3>Nothing available for these dates</h3>
              <p>Try another date range or reduce the number of guests.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
