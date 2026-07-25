"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2, Check, X, GripVertical } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/Toast";
import { mockAnnouncements, type Announcement } from "@/components/mock/settlementMockData";
import { useScrollContainerRef } from "@/components/layout/ScrollContainerContext";
import { useStuckHeader } from "@/hooks/useStuckHeader";

/** 공지사항 섹션: 드래그 정렬(시각적 순서 변경만), 편집/삭제/추가 UI. Supabase 미연동. */
export function AnnouncementSection() {
  const scrollRef = useScrollContainerRef();
  const headerRef = useRef<HTMLDivElement>(null);
  const stuck = useStuckHeader(scrollRef, headerRef);
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [titleError, setTitleError] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);
  const [undoToast, setUndoToast] = useState<{ item: Announcement; index: number; message: string } | null>(null);

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
    setTitleError(false);
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
    setTitleError(false);
  };

  const closeForm = () => {
    setAdding(false);
    setEditingId(null);
    setTitleError(false);
  };

  const save = () => {
    if (!title.trim()) {
      setTitleError(true);
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
    const idx = announcements.findIndex((a) => a.id === pendingDeleteId);
    const item = announcements[idx];
    setAnnouncements((prev) => prev.filter((a) => a.id !== pendingDeleteId));
    setPendingDeleteId(null);
    const textSnippet = item.text.slice(0, 10) + (item.text.length > 10 ? "..." : "");
    setUndoToast({ item, index: idx, message: `공지사항 '${textSnippet}' 항목을 삭제했어요.` });
    setTimeout(() => setUndoToast(null), 3000);
  };
  const undoDelete = () => {
    if (!undoToast) return;
    setAnnouncements((prev) => {
      const arr = [...prev];
      arr.splice(undoToast.index, 0, undoToast.item);
      return arr;
    });
    setUndoToast(null);
  };

  const reorder = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragOverId(null);
      return;
    }
    setAnnouncements((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((a) => a.id === dragId);
      const to = arr.findIndex((a) => a.id === targetId);
      const [moved] = arr.splice(from, 1);
      arr.splice(to, 0, moved);
      return arr;
    });
    setDragId(null);
    setDragOverId(null);
  };

  const moveToEnd = () => {
    if (!dragId) {
      setDragOverId(null);
      return;
    }
    setAnnouncements((prev) => {
      const arr = [...prev];
      const from = arr.findIndex((a) => a.id === dragId);
      if (from === -1) return prev;
      const [moved] = arr.splice(from, 1);
      arr.push(moved);
      return arr;
    });
    setDragId(null);
    setDragOverId(null);
  };

  const pendingDeleteItem = announcements.find((a) => a.id === pendingDeleteId);

  return (
    <div className="border-b border-[#edece9] pb-6">
      <div
        ref={headerRef}
        data-testid="announcement-header"
        className={`sticky top-0 z-[6] mb-2.5 flex items-center justify-between bg-white pt-[21px] pb-1.5 ${
          stuck ? "border-b border-[#edece9]" : ""
        }`}
      >
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
            onDragOver={(e) => {
              e.preventDefault();
              if (dragId && dragId !== a.id) setDragOverId(a.id);
            }}
            onDragEnd={() => setDragOverId(null)}
            onDrop={() => reorder(a.id)}
            className={`flex items-center gap-2.5 rounded-[14px] bg-[#fdf3e2] p-3.5 px-4 ${
              dragId && dragId !== a.id && dragOverId === a.id ? "border-t-2 border-t-[#2f6f52]" : ""
            }`}
          >
            {editingId === a.id ? (
              <div className="flex flex-1 items-start gap-2.5">
                <div className="flex flex-1 flex-col gap-1.5">
                  <input
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      setTitleError(false);
                    }}
                    placeholder="제목"
                    className={`h-8 rounded-md border bg-white px-2.5 text-[15px] font-bold ${
                      titleError ? "border-[#c0433a]" : "border-[#e3e1db]"
                    }`}
                  />
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="어떤 내용을 공지할까요?"
                    rows={2}
                    className="rounded-md border border-[#e3e1db] bg-white px-2.5 py-1.5 text-[13px]"
                  />
                </div>
                <div className="flex items-center gap-[5px]">
                  <IconButton icon={Check} label="저장" onClick={save} />
                  <IconButton icon={X} label="취소" onClick={closeForm} />
                </div>
              </div>
            ) : (
              <>
                <span className="text-[13px] text-[#c7ab7a]" aria-hidden>
                  <GripVertical width={16} height={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-[#1a1a1a]">{a.title}</div>
                  <div className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-[#5c5646]">{a.text}</div>
                </div>
                <div className="flex items-center gap-[5px]">
                  <IconButton icon={Pencil} label="공지사항 수정" onClick={() => startEdit(a)} />
                  <IconButton icon={Trash2} label="공지사항 삭제" variant="danger" onClick={() => requestDelete(a.id)} />
                </div>
              </>
            )}
          </div>
        ))}

        <div
          data-testid="announcement-end-drop-zone"
          onDragOver={(e) => {
            e.preventDefault();
            if (dragId) setDragOverId("__end__");
          }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={moveToEnd}
          className={`h-1.5 ${dragId && dragOverId === "__end__" ? "border-t-2 border-t-[#2f6f52]" : ""}`}
        />

        {adding && (
          <div className="flex flex-col gap-2 rounded-[14px] border border-[#e3e1db] bg-[#fafaf8] p-3.5 px-4">
            <div className="flex items-start gap-2.5">
              <div className="flex flex-1 flex-col gap-1.5">
                <input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setTitleError(false);
                  }}
                  placeholder="제목"
                  className={`h-8 rounded-md border bg-white px-2.5 text-[15px] font-bold ${
                    titleError ? "border-[#c0433a]" : "border-[#e3e1db]"
                  }`}
                />
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="어떤 내용을 공지할까요?"
                  rows={2}
                  className="rounded-md border border-[#e3e1db] bg-white px-2.5 py-1.5 text-[13px]"
                />
              </div>
              <div className="flex items-center gap-[5px]">
                <IconButton icon={Check} label="저장" onClick={save} />
                <IconButton icon={X} label="취소" onClick={closeForm} />
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        open={pendingDeleteId !== null}
        title="공지사항을 삭제할까요?"
        description={`'${pendingDeleteItem?.text.slice(0, 10) ?? ""}${(pendingDeleteItem?.text.length ?? 0) > 10 ? "..." : ""}' 공지사항이 삭제돼요.`}
        confirmLabel="삭제"
        cancelAriaLabel="공지사항 삭제 취소"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDeleteId(null)}
        danger
      />

      {warning && <ToastStack toasts={[{ id: "warn", message: warning, variant: "warning" }]} />}

      {undoToast && (
        <div className="fixed bottom-6 left-1/2 z-[999] -translate-x-1/2">
          <div className="flex items-center gap-2.5 rounded-[9px] bg-[#1c231f] px-5 py-3 text-[13px] whitespace-nowrap text-white shadow-[0_8px_24px_rgba(0,0,0,0.2)]">
            <span>{undoToast.message}</span>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                undoDelete();
              }}
              className="font-bold text-[#8fd4b0] underline"
            >
              실행취소
            </a>
          </div>
        </div>
      )}

      <Modal
        open={showUnsavedAlert}
        title="작성중인 공지사항이 있어요!"
        description="저장 혹은 취소 후 다음 작업을 진행해주세요."
        confirmLabel="확인"
        cancelAriaLabel="편집 경고 확인 취소"
        onConfirm={() => setShowUnsavedAlert(false)}
        onCancel={() => setShowUnsavedAlert(false)}
      />
    </div>
  );
}
