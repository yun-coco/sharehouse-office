"use client";

import { useState } from "react";
import { Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/Toast";
import { mockAnnouncements, type Announcement } from "@/components/mock/settlementMockData";

/** 공지사항 섹션: 드래그 정렬(시각적 순서 변경만), 편집/삭제/추가 UI. Supabase 미연동. */
export function AnnouncementSection() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  const showWarning = (msg: string) => {
    setWarning(msg);
    setTimeout(() => setWarning(null), 1500);
  };

  const openAdd = () => {
    if (adding || editingId) {
      setShowUnsavedAlert(true);
      return;
    }
    setAdding(true);
    setEditingId(null);
    setTitle("");
    setText("");
  };

  const startEdit = (a: Announcement) => {
    if ((adding || editingId) && editingId !== a.id) {
      setShowUnsavedAlert(true);
      return;
    }
    setEditingId(a.id);
    setAdding(false);
    setTitle(a.title);
    setText(a.text);
  };

  const closeForm = () => {
    setAdding(false);
    setEditingId(null);
  };

  const save = () => {
    if (!title.trim()) {
      showWarning("제목을 입력해주세요");
      return;
    }
    if (!text.trim()) return;
    if (editingId) {
      setAnnouncements((prev) =>
        prev.map((a) => (a.id === editingId ? { ...a, title: title.trim(), text: text.trim() } : a)),
      );
    } else {
      setAnnouncements((prev) => [...prev, { id: `ann-${Date.now()}`, title: title.trim(), text: text.trim() }]);
    }
    closeForm();
  };

  const requestDelete = (id: string) => setPendingDeleteId(id);
  const confirmDelete = () => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== pendingDeleteId));
    setPendingDeleteId(null);
  };

  const reorder = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    setAnnouncements((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((a) => a.id === dragId);
      const to = arr.findIndex((a) => a.id === targetId);
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
    setDragId(null);
  };

  const moveToEnd = () => {
    if (!dragId) return;
    setAnnouncements((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((a) => a.id === dragId);
      if (from === -1) return prev;
      const [moved] = arr.splice(from, 1);
      arr.push(moved);
      return arr;
    });
    setDragId(null);
  };

  const pendingDeleteItem = announcements.find((a) => a.id === pendingDeleteId);

  return (
    <div className="border-b border-[#edece9] pb-6">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="text-xl font-bold whitespace-nowrap text-[#1a1a1a]">📌 공지사항</div>
          <div className="text-[11px] whitespace-nowrap text-[#b3b2ab]">드래그해서 순서를 바꿔보세요</div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="cursor-pointer rounded-md border border-[#cfe4da] bg-white px-4 py-2 text-[13px] font-bold text-[#2f6f52]"
        >
          + 추가
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <div
            key={a.id}
            data-testid={`announcement-row-${a.id}`}
            draggable
            onDragStart={() => setDragId(a.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => reorder(a.id)}
            className="flex items-center gap-2.5 rounded-2xl bg-[#fdf3e2] p-3.5 px-4"
          >
            {editingId === a.id ? (
              <div className="flex flex-1 items-start gap-2.5">
                <div className="flex flex-1 flex-col gap-1.5">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="제목"
                    className="h-8 rounded-md border border-[#e3e1db] bg-white px-2.5 text-[15px] font-bold"
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="어떤 내용을 공지할까요?"
                    rows={2}
                    className="rounded-md border border-[#e3e1db] bg-white px-2.5 py-1.5 text-[13px]"
                  />
                </div>
                <IconButton icon={Check} label="저장" onClick={save} />
                <IconButton icon={X} label="취소" onClick={closeForm} />
              </div>
            ) : (
              <>
                <span className="text-[13px] text-[#c7ab7a]" aria-hidden>
                  <GripVertical width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[#1a1a1a]">{a.title}</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-[#5c5646]">{a.text}</div>
                </div>
                <IconButton icon={Pencil} label="공지사항 수정" onClick={() => startEdit(a)} />
                <IconButton icon={Trash2} label="공지사항 삭제" variant="danger" onClick={() => requestDelete(a.id)} />
              </>
            )}
          </div>
        ))}

        <div
          data-testid="announcement-end-drop-zone"
          onDragOver={(e) => e.preventDefault()}
          onDrop={moveToEnd}
          className="h-1.5"
        />

        {adding && (
          <div className="flex flex-col gap-2 rounded-2xl border border-[#e3e1db] bg-[#fafaf8] p-3.5 px-4">
            <div className="flex items-start gap-2.5">
              <div className="flex flex-1 flex-col gap-1.5">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="제목"
                  className="h-8 rounded-md border border-[#e3e1db] bg-white px-2.5 text-[15px] font-bold"
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="어떤 내용을 공지할까요?"
                  rows={2}
                  className="rounded-md border border-[#e3e1db] bg-white px-2.5 py-1.5 text-[13px]"
                />
              </div>
              <IconButton icon={Check} label="저장" onClick={save} />
              <IconButton icon={X} label="취소" onClick={closeForm} />
            </div>
          </div>
        )}
      </div>

      <Modal
        open={pendingDeleteId !== null}
        title="공지사항을 삭제할까요?"
        description={`'${pendingDeleteItem?.text.slice(0, 10) ?? ""}${(pendingDeleteItem?.text.length ?? 0) > 10 ? "..." : ""}' 공지사항이 삭제돼요.`}
        confirmLabel="삭제"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
        danger
      />

      {warning && <ToastStack toasts={[{ id: "warn", message: warning, variant: "warning" }]} />}

      <Modal
        open={showUnsavedAlert}
        title="작성중인 공지사항이 있어요!"
        description="저장 혹은 취소 후 다음 작업을 진행해주세요."
        confirmLabel="확인"
        onConfirm={() => setShowUnsavedAlert(false)}
        onCancel={() => setShowUnsavedAlert(false)}
      />
    </div>
  );
}
