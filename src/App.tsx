import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_ANON_KEY!
);

type User = {
  user_id: string;
  email: string;
  created_at?: string;
};

type Feedback = {
  id: string;
  created_at: string;
  user_id: string;
  transcript?: string | null;
  intent?: string | null;
  item?: string | null;
  location?: string | null;
  confidence_score?: number | null;
  action_type?: string | null;
  was_correct?: boolean | null;
  corrected_item?: string | null;
  corrected_location?: string | null;
  corrected_command?: string | null;
  note?: string | null;
  audio_url?: string | null;
};

type StoredItem = {
  id: string;
  item_name: string;
  location: string;
  notes: string | null;
  created_at: string;
};

export default function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [items, setItems] = useState<StoredItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestUsers, setLatestUsers] = useState<User[]>([]);

  useEffect(() => {


    const fetchLatestUsers = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, email, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
    
      if (error) {
        console.error('Failed to fetch latest users:', error);
      } else {
        setLatestUsers(data || []);
      }
    };
    
    fetchLatestUsers();

    
    const fetchUsers = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id, email')
        .order('email');

      if (error) {
        setError('Failed to load users');
        console.error(error);
      } else {
        setUsers(data || []);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedEmail) return;
      setLoading(true);
      setError(null);

      try {
        const user = users.find((u) => u.email === selectedEmail);
        if (!user) throw new Error('User not found');

        const [feedbackRes, itemsRes] = await Promise.all([
          supabase
            .from('transcript_feedback')
            .select('*')
            .eq('user_id', user.user_id)
            .order('created_at', { ascending: false }),

          supabase
            .from('stored_items')
            .select('*')
            .eq('user_id', user.user_id)
            .order('created_at', { ascending: false }),
        ]);

        if (feedbackRes.error || itemsRes.error) {
          throw feedbackRes.error || itemsRes.error;
        }

        setFeedback(feedbackRes.data || []);
        setItems(itemsRes.data || []);
      } catch (err) {
        setError('Failed to load data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedEmail, users]);

  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif', maxWidth: 800 }}>
      {latestUsers.length > 0 && (
  <div style={{ marginBottom: 30 }}>
    <h3 style={{ marginBottom: 10 }}>🧑‍💻 Latest Users</h3>
    <div
      style={{
        display: 'flex',
        overflowX: 'auto',
        gap: '12px',
        paddingBottom: 10,
        scrollbarWidth: 'thin'
      }}
    >
      {latestUsers.map((u) => (
        <div
          key={u.user_id}
          style={{
            flex: '0 0 auto',
            minWidth: 200,
            padding: 12,
            border: '1px solid #ddd',
            borderRadius: 8,
            backgroundColor: '#f9f9f9',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ fontWeight: 600 }}>{u.email}</div>
          <div style={{ fontSize: '0.85em', color: '#666' }}>
          {u.created_at
  ? new Date(u.created_at).toLocaleString()
  : <em>Unknown date</em>}
          </div>
        </div>
      ))}
    </div>
  </div>
)}


      <h2>Transcript Feedback Viewer</h2>

      <label htmlFor="email">Filter by user email:</label>
      <select
        id="email"
        value={selectedEmail || ''}
        onChange={(e) => setSelectedEmail(e.target.value)}
        style={{
          display: 'block',
          marginBottom: 20,
          padding: '0.5em',
          width: '100%',
        }}
      >
        <option value="">-- Select a user --</option>
        {users.map((user) => (
          <option key={user.user_id} value={user.email}>
            {user.email}
          </option>
        ))}
      </select>

      {loading && <p>Loading data...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {items.length > 0 && (
        <div style={{ marginBottom: 30 }}>
          <h3>📦 Saved Items</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 8,
                    borderBottom: '1px solid #ccc',
                  }}
                >
                  Item
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 8,
                    borderBottom: '1px solid #ccc',
                  }}
                >
                  Location
                </th>
                <th
                  style={{
                    textAlign: 'left',
                    padding: 8,
                    borderBottom: '1px solid #ccc',
                  }}
                >
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td style={{ padding: 8 }}>{item.item_name}</td>
                  <td style={{ padding: 8 }}>{item.location}</td>
                  <td style={{ padding: 8 }}>{item.notes || <em>–</em>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div
        style={{
          maxHeight: 500,
          overflowY: 'auto',
          borderTop: '1px solid #ddd',
        }}
      >
        {feedback.map((f) => (
          <div
            key={f.id}
            style={{ padding: '12px 0', borderBottom: '1px solid #eee' }}
          >
            <div style={{ fontSize: '0.85em', color: '#666' }}>
              {new Date(f.created_at).toLocaleString()}
            </div>
            <div>
              <strong>Transcript:</strong> {f.transcript || <em>None</em>}
            </div>
            <div>
              <strong>Intent:</strong> {f.intent}
            </div>
            <div>
              <strong>Action Type:</strong> {f.action_type}
            </div>
            <div>
              <strong>Item:</strong> {f.item}
            </div>
            <div>
              <strong>Location:</strong> {f.location || <em>Not provided</em>}
            </div>
            <div>
              <strong>Confidence:</strong> {f.confidence_score ?? <em>n/a</em>}
            </div>
            <div>
              <strong>Was Correct:</strong> {f.was_correct ? '✅ Yes' : '❌ No'}
            </div>
            {f.corrected_item && (
              <div>
                <strong>Corrected Item:</strong> {f.corrected_item}
              </div>
            )}
            {f.corrected_location && (
              <div>
                <strong>Corrected Location:</strong> {f.corrected_location}
              </div>
            )}
            {f.corrected_command && (
              <div>
                <strong>Corrected Command:</strong> {f.corrected_command}
              </div>
            )}
            {f.note && (
              <div>
                <strong>Note:</strong> {f.note}
              </div>
            )}
            {f.audio_url && (
              <div style={{ marginTop: 4 }}>
                <audio controls src={f.audio_url}></audio>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
