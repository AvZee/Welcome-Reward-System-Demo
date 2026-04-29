import { useEffect, useState } from "react";
import { 
  completeOnboarding,
  getDemoUsers,
  getNotifications,
  getRewardEvents,
  getRewardStatus,
  resetDemoUser,
} from "./lib/api";
import "./App.css";

type DemoUser = {
  id: string;
  email: string;
  name: string;
}

type RewardStatus = "not_started" | "scheduled" | "sent" | "already_completed";

type RewardEvent = {
  id: string;
  userId: string;
  eventType: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  sentAt: string;
};

function App() {
  const [userId, setUserId] = useState("");
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [status, setStatus] = useState<RewardStatus | null>(null);
  const [events, setEvents] = useState<RewardEvent[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function refreshData(id = userId) {
    if (!id.trim()) {
      setError("Enter a user ID first");
      return;
    }

    try {
      setError("");

      const statusData = await getRewardStatus(id);
      const eventsData = await getRewardEvents(id);
      const notificationData = await getNotifications(id);

      setStatus(statusData.status);
      setEvents(eventsData.events ?? []);
      setNotifications(notificationData.notifications ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    }
  }

  async function handleCompleteOnboarding() {
    if (!userId.trim()) {
      setError("Enter a user ID first.");
      return;
    }

    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const data = await completeOnboarding(userId);

      if (data.scheduledFor) {
        setScheduledFor(data.scheduledFor);
      }

      setMessage(data.message ?? "Onboarding completed.");
      await refreshData(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResetDemo() {
    if (!userId.trim()) {
      setError("Select a demo user first.");
      return;
    }

    setIsLoading(true);
    setIsResetting(true);
    setError("");
    setMessage("");

    try {
      const data = await resetDemoUser(userId);

      setMessage(data.message ?? "Demo user reset.");
      setStatus("not_started");
      setNotifications([]);
      setEvents([]);
      setScheduledFor(null);
      setRemainingSeconds(null);

      await refreshData(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setIsLoading(false);
      setIsResetting(false);
    }
  }

  // Handles the countdown to when the registered job becomes eligible for the worker
  useEffect(() => {
    if (!scheduledFor || status === "sent") {
      setRemainingSeconds(null);
      return;
    }

    const updateCountdown = () => {
      const remainingMs = new Date(scheduledFor).getTime() - Date.now();
      setRemainingSeconds(Math.max(0, Math.ceil(remainingMs / 1000)));
    };

    updateCountdown();

    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(intervalId);
  }, [scheduledFor, status]);

  useEffect(() => {
    async function loadDemoUsers() {
      try {
        const data = await getDemoUsers();
        setDemoUsers(data.users ?? []);

        if (data.users?.[0]) {
          setUserId(data.users[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load users");
      }
    }

    loadDemoUsers();
  }, []);

  useEffect(() => {
    if (userId.trim()) {
      refreshData(userId);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId.trim()) return;

    const intervalId = window.setInterval(() => {
      refreshData(userId);
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [userId]);

  function formatName(name: string) {
    return name
      .split("_")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
  }

  function formatEventDescription(eventType: string) {
    switch (eventType) {
      case "onboarding_completed":
        return "The user completed onboarding.";
      case "reward_job_enqueued":
        return "A delayed welcome reward job was scheduled.";
      case "reward_notification_sent":
        return "The worker sent the welcome reward notification.";
      case "reward_notification_skipped":
        return "The worker skipped sending a duplicate or invalid reward.";
      default:
        return "Reward system event recorded";
    }
  }

  function formatCountdown(seconds: number) {
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (secs === 0) {
      return `${mins}m`;
    }

    return `${mins}m ${secs}s`;
  }

  return (
    <main className="app-shell">
      <section className="hero-card">
        <p className="eyebrow">Background Jobs Demo</p>
        <h1>Welcome Reward System</h1>
        <p className="subtitle">
          Complete onboarding, enqueue a delayed pg-boss job, and watch the reward notification appear after the worker runs.
        </p>

        <div className="input-row">
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          >
            <option value="">Select demo user</option>
            {demoUsers.map((user) => (
              <option value={user.id} key={user.id}>
                {user.name} - {user.email}
              </option>
            ))}
          </select>
          <div className="button-row">
            <button onClick={handleCompleteOnboarding} disabled={isLoading || !userId.trim()}>
              {isLoading ? (isResetting ? "Loading..." : "Scheduling...") : "Complete Onboarding"}
            </button>

            <button
              className="secondary-button"
              onClick={handleResetDemo}
              disabled={isLoading || !userId.trim()}
            >
              {isLoading ? (isResetting ? "Resetting..." : "Loading...") : "Reset Demo User"}
            </button>
          </div>
        </div>
        
        <div className="message-container">
          {message && <p className="success-message">{message}</p>}
          {error && <p className="error-message">{error}</p>}
        </div>
      </section>

      <section className="grid">
        <article className="panel">
          <h2>Reward Status</h2>
          <div className={`status-badge ${status ?? "unknown"}`}>
            {status ? formatName(status) : "No user loaded"}
          </div>

          <p className="panel-copy">
            The frontend polls every few seconds, so the status should move from "scheduled" to "sent" after the job runs.
            The timer counts down to when the job becomes eligible. The worker then picks it up and writes the notification.
          </p>

          {status === "scheduled" && remainingSeconds !== null && (
            <div className="countdown-card">
              {(remainingSeconds === 0) ? null : <span className="countdown-label">Estimated worker pickup in</span>}
              <strong>{(remainingSeconds === 0) ? "Processing..." : formatCountdown(remainingSeconds)}</strong>
            </div>
          )}
        </article>

        <article className="panel">
          <h2>Notifications</h2>

          {notifications.length === 0 ? (
            <p className="empty-state">No notifications yet</p>
          ) : (
            <div className="notification-list">
              {notifications.map((notification) => (
                <div className="notification-card" key={notification.id}>
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <small>
                    Sent: {new Date(notification.sentAt).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="panel timeline-panel">
          <h2>Reward Timeline</h2>

          {events.length === 0 ? (
            <p className="empty-state">No reward events yet</p>
          ) : (
            <div className="timeline">
              {events.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <div className="timeline-dot" />

                  <div>
                    <h3>{formatName(event.eventType)}</h3>
                    <p>{formatEventDescription(event.eventType)}</p>
                    <small>{new Date(event.createdAt).toLocaleString()}</small>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}

export default App;