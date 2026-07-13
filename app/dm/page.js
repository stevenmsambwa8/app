'use client'
import { useState, useRef, useEffect } from 'react'
import Avatar from '../../components/Avatar'
import { CONVOS, userById } from '../../lib/mockData'
import styles from './page.module.css'

export default function DMPage() {
  const [activeId, setActiveId] = useState(null);
  const [convos, setConvos] = useState(CONVOS);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef(null);

  const active = convos.find((c) => c.id === activeId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' });
  }, [active?.messages?.length, activeId]);

  function send() {
    if (!draft.trim() || !active) return;
    setConvos((cs) =>
      cs.map((c) =>
        c.id === active.id
          ? { ...c, messages: [...c.messages, { from: 'me', text: draft }], unread: 0 }
          : c
      )
    );
    setDraft('');
  }

  if (!active) {
    return (
      <div className={styles.list}>
        {convos.map((c) => {
          const user = userById(c.uid);
          const last = c.messages[c.messages.length - 1]?.text || '';
          return (
            <button key={c.id} className={`card ${styles.row}`} onClick={() => setActiveId(c.id)}>
              <Avatar emoji={user.avatar} size={44} />
              <div className={styles.who}>
                <div className={styles.name}>{user.name}</div>
                <span className={styles.last}>{last}</span>
              </div>
              {c.unread > 0 && <span className={styles.unread}>{c.unread}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  const user = userById(active.uid);

  return (
    <div className={styles.thread}>
      <div className={styles.threadHeader}>
        <button className={styles.back} onClick={() => setActiveId(null)}>
          <i className="ri-arrow-left-line" />
        </button>
        <Avatar emoji={user.avatar} size={32} />
        <span className={styles.threadName}>{user.name}</span>
      </div>

      <div className={styles.messages}>
        {active.messages.map((m, i) => (
          <div key={i} className={`${styles.bubble} ${m.from === 'me' ? styles.me : styles.them}`}>
            {m.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className={styles.composer}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Message..."
        />
        <button className={styles.send} onClick={send}>
          <i className="ri-send-plane-fill" />
        </button>
      </div>
    </div>
  );
}
