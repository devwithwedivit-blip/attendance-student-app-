import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, LogOut } from 'lucide-react';

export default function StatusBadge({ status, type, flagged }) {
  if (flagged) {
    return (
      <span className="badge badge-coral">
        <AlertTriangle size={13} />
        Suspicious / Flagged
      </span>
    );
  }

  if (type === 'check_in') {
    return (
      <span className="badge badge-emerald">
        <CheckCircle2 size={13} />
        Check In
      </span>
    );
  }

  if (type === 'check_out') {
    return (
      <span className="badge badge-amber">
        <LogOut size={13} />
        Check Out
      </span>
    );
  }

  switch (status) {
    case 'CHECKED_IN':
      return (
        <span className="badge badge-emerald badge-pulse">
          Checked In
        </span>
      );
    case 'CHECKED_OUT':
      return (
        <span className="badge badge-amber">
          <Clock size={13} />
          Checked Out
        </span>
      );
    case 'LATE':
      return (
        <span className="badge badge-coral">
          <Clock size={13} />
          Late Arrival
        </span>
      );
    case 'ABSENT':
      return (
        <span className="badge badge-muted">
          <XCircle size={13} />
          Absent
        </span>
      );
    default:
      return (
        <span className="badge badge-muted">
          Not Checked In
        </span>
      );
  }
}
