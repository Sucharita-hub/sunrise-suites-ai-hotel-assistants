import { BedDouble, CheckCircle2, Users, Ruler, Check } from "lucide-react";

export default function RoomCard({ room, nights, selected, onSelect }) {
  return (
    <article className="room-card">
      <img src={room.image} alt={room.name} className="room-image" />
      <div className="room-info">
        <div className="room-heading">
          <div>
            <h3>{room.name}</h3>
            <p>{room.description}</p>
          </div>
          <span className="available-badge">
            <CheckCircle2 size={14} /> Available
          </span>
        </div>

        <div className="room-meta">
          <span><BedDouble size={15} /> {room.beds}</span>
          <span><Users size={15} /> Up to {room.maxGuests}</span>
          <span><Ruler size={15} /> {room.size}</span>
        </div>

        <div className="room-footer">
          <div>
            <div className="price">₹{room.price.toLocaleString("en-IN")} <small>/ night</small></div>
            <div className="total-price">
              ₹{room.totalPrice.toLocaleString("en-IN")} total · {nights} night{nights > 1 ? "s" : ""}
            </div>
          </div>
          <button
            type="button"
            className={`primary-button small${selected ? " selected" : ""}`}
            onClick={() => onSelect?.(room)}
            disabled={selected}
          >
            {selected ? <><Check size={15} /> Selected</> : "Select Room"}
          </button>
        </div>
      </div>
    </article>
  );
}
