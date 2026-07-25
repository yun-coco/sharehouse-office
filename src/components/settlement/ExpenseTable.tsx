"use client";

import { useRef, useState } from "react";
import { Pencil, Trash2, Check, X, Download } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { ToastStack } from "@/components/ui/Toast";
import { DateRangePopover } from "@/components/settlement/DateRangePopover";
import { useScrollContainerRef } from "@/components/layout/ScrollContainerContext";
import { useStuckHeader } from "@/hooks/useStuckHeader";
import {
  mockExpenses,
  CATEGORY_META,
  SINGLE_INSTANCE_CATEGORIES,
  formatWon,
  formatDate,
  type MaintenanceFeeItem,
  type MaintenanceFeeCategory,
  type ReceiptState,
} from "@/components/mock/settlementMockData";

const ALL_CATEGORIES: MaintenanceFeeCategory[] = ["가스비", "전기세", "수도세", "인터넷", "공용물품"];

function sortExpenses(items: MaintenanceFeeItem[]): MaintenanceFeeItem[] {
  return [...items].sort((a, b) => {
    const ca = ALL_CATEGORIES.indexOf(a.category);
    const cb = ALL_CATEGORIES.indexOf(b.category);
    if (ca !== cb) return ca - cb;
    return a.startDate.localeCompare(b.startDate);
  });
}

interface DraftExpense {
  category: MaintenanceFeeCategory | "";
  startDate: string;
  endDate: string;
  amount: string;
  memo: string;
  receiptState: ReceiptState;
}

const EMPTY_DRAFT: DraftExpense = { category: "", startDate: "", endDate: "", amount: "", memo: "", receiptState: "none" };

/** 이번달 관리비 표. 데스크톱은 테이블, 모바일은 카드 리스트로 반응형 전환. Supabase 미연동, mock 데이터로 시뮬레이션. */
export function ExpenseTable() {
  const scrollRef = useScrollContainerRef();
  const headerRef = useRef<HTMLDivElement>(null);
  const stuck = useStuckHeader(scrollRef, headerRef);
  const [expenses, setExpenses] = useState<MaintenanceFeeItem[]>(mockExpenses);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftExpense>(EMPTY_DRAFT);
  const [warning, setWarning] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [undoToast, setUndoToast] = useState<{ item: MaintenanceFeeItem; index: number; message: string } | null>(null);
  const [previewCategory, setPreviewCategory] = useState<string | null>(null);
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false);

  const showWarning = (msg: string) => {
    setWarning(msg);
    setTimeout(() => setWarning(null), 1500);
  };

  const usedCategories = new Set(expenses.filter((e) => e.id !== editingId).map((e) => e.category));

  const openAdd = () => {
    if (showForm) {
      setShowUnsavedAlert(true);
      return;
    }
    setShowForm(true);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
  };

  const startEdit = (item: MaintenanceFeeItem) => {
    if (showForm && editingId !== item.id) {
      setShowUnsavedAlert(true);
      return;
    }
    setShowForm(true);
    setEditingId(item.id);
    setDraft({
      category: item.category,
      startDate: item.startDate,
      endDate: item.endDate ?? "",
      amount: String(item.amount),
      memo: item.memo,
      receiptState: item.receiptState,
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
  };

  const save = () => {
    if (!draft.category) {
      showWarning("카테고리를 선택해주세요");
      return;
    }
    if (!draft.startDate) {
      showWarning("시작일(구매일)을 입력해주세요");
      return;
    }
    if (!draft.amount || Number(draft.amount) <= 0) {
      showWarning("금액을 입력해주세요");
      return;
    }
    if (draft.endDate && draft.endDate < draft.startDate) {
      showWarning("종료일은 시작일보다 빠를 수 없어요");
      return;
    }
    const payload: MaintenanceFeeItem = {
      id: editingId ?? `exp-${Date.now()}`,
      category: draft.category,
      startDate: draft.startDate,
      endDate: draft.endDate || null,
      amount: Number(draft.amount),
      memo: draft.memo,
      receiptState: draft.receiptState,
    };
    setExpenses((prev) =>
      sortExpenses(editingId ? prev.map((e) => (e.id === editingId ? payload : e)) : [...prev, payload]),
    );
    closeForm();
  };

  const toggleReceipt = () => {
    const next: ReceiptState = draft.receiptState === "none" ? "error" : draft.receiptState === "error" ? "uploaded" : "none";
    if (next === "error") showWarning("이미지를 업로드할 수 없습니다 (용량/형식 확인)");
    setDraft((d) => ({ ...d, receiptState: next }));
  };

  const requestDelete = (id: string) => setPendingDeleteId(id);
  const confirmDelete = () => {
    const idx = expenses.findIndex((e) => e.id === pendingDeleteId);
    const item = expenses[idx];
    setExpenses((prev) => prev.filter((e) => e.id !== pendingDeleteId));
    setPendingDeleteId(null);
    setUndoToast({ item, index: idx, message: `이번달 관리비 테이블에서 '${item.category}' 행을 삭제했어요.` });
    setTimeout(() => setUndoToast(null), 3000);
  };
  const undoDelete = () => {
    if (!undoToast) return;
    setExpenses((prev) => {
      const arr = [...prev];
      arr.splice(undoToast.index, 0, undoToast.item);
      return arr;
    });
    setUndoToast(null);
  };

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingDeleteItem = expenses.find((e) => e.id === pendingDeleteId);

  const categorySelect = (
    <select
      value={draft.category}
      onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as MaintenanceFeeCategory }))}
      className="h-[30px] w-full rounded-[5px] border border-[#e3e1db] px-1 text-center text-[13px]"
      style={{ textAlignLast: "center" }}
    >
      <option value="">항목 선택</option>
      {ALL_CATEGORIES.map((c) => {
        const disabled = SINGLE_INSTANCE_CATEGORIES.includes(c) && usedCategories.has(c) && draft.category !== c;
        const usedLabel = SINGLE_INSTANCE_CATEGORIES.includes(c) && usedCategories.has(c) ? " (입력됨)" : "";
        return (
          <option key={c} value={c} disabled={disabled}>
            {c + usedLabel}
          </option>
        );
      })}
    </select>
  );

  const startDatePopover = (
    <DateRangePopover
      value={draft.startDate || null}
      onChange={(d) => setDraft((s) => ({ ...s, startDate: d }))}
      placeholder="시작일 선택"
      anchor="left"
    />
  );

  const endDatePopover = (
    <DateRangePopover
      value={draft.endDate || null}
      onChange={(d) => setDraft((s) => ({ ...s, endDate: d }))}
      placeholder="종료일 선택"
      anchor="right"
      allowClear
      onClear={() => setDraft((s) => ({ ...s, endDate: "" }))}
    />
  );

  const amountInput = (
    <input
      type="text"
      inputMode="numeric"
      placeholder="금액"
      value={draft.amount ? Number(draft.amount).toLocaleString("ko-KR") : ""}
      onChange={(e) => setDraft((s) => ({ ...s, amount: e.target.value.replace(/[^0-9]/g, "") }))}
      className="h-[30px] w-full rounded-[5px] border border-[#e3e1db] px-2 text-right text-[13px]"
    />
  );

  const memoTextarea = (
    <textarea
      placeholder="메모"
      value={draft.memo}
      onChange={(e) => setDraft((s) => ({ ...s, memo: e.target.value }))}
      rows={1}
      className="h-[30px] w-full rounded-[5px] border border-[#e3e1db] px-1 text-[13px]"
    />
  );

  const receiptToggleButton = (
    <button
      type="button"
      onClick={toggleReceipt}
      className={`h-[30px] w-full cursor-pointer rounded-[5px] border border-[#e3e1db] bg-white px-1 text-[13px] ${
        draft.receiptState === "error" ? "text-[#c0433a]" : "text-[#37352f]"
      }`}
    >
      {draft.receiptState === "uploaded" ? "변경하기" : draft.receiptState === "error" ? "업로드 실패" : "첨부하기"}
    </button>
  );

  const saveCancelButtons = (
    <div className="flex items-center justify-center gap-0.5">
      <IconButton icon={Check} label="저장" onClick={save} />
      <IconButton icon={X} label="취소" onClick={closeForm} />
    </div>
  );

  const mobileEditFields = (
    <>
      <div className="flex items-center gap-1.5">
        <div className="w-[70px] flex-shrink-0">{categorySelect}</div>
        <div className="min-w-0 flex-1">{startDatePopover}</div>
        <div className="min-w-0 flex-1">{endDatePopover}</div>
        <div className="w-[92px] flex-shrink-0">{amountInput}</div>
      </div>
      {memoTextarea}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] text-[#6b6b62]">영수증</span>
          {receiptToggleButton}
        </div>
        {saveCancelButtons}
      </div>
    </>
  );

  return (
    <div className="border-b border-[#edece9] pb-6">
      <div
        ref={headerRef}
        data-testid="expense-header"
        className={`sticky top-0 z-[6] mb-3 flex items-center justify-between bg-white py-1 ${
          stuck ? "border-b border-[#edece9]" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold whitespace-nowrap text-[#1a1a1a]">💵 이번달 관리비</div>
          <button
            type="button"
            className="inline-flex min-h-[44px] items-center gap-1 border-none bg-transparent text-[11px] text-[#b3b2ab] underline"
          >
            <Download width={16} height={16} />
            이미지 저장
          </button>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="cursor-pointer rounded-md border border-[#cfe4da] bg-white px-4 py-2 text-[13px] font-bold text-[#2f6f52]"
        >
          + 추가
        </button>
      </div>

      {expenses.length === 0 && !showForm ? (
        <>
          <div className="relative hidden md:block" data-testid="expense-empty-blur-table">
            <table className="pointer-events-none w-full table-fixed border-collapse text-[13px] blur-[3px] opacity-55 select-none">
              <thead>
                <tr className="border-b border-[#edece9] text-[#9b9a97]">
                  <th style={{ width: "14%" }} className="p-2 text-center font-semibold">항목</th>
                  <th style={{ width: "16%" }} className="p-2 text-center font-semibold">시작일/구매일</th>
                  <th style={{ width: "16%" }} className="p-2 text-center font-semibold">종료일</th>
                  <th style={{ width: "14%" }} className="p-2 text-center font-semibold">금액</th>
                  <th style={{ width: "22%" }} className="p-2 text-center font-semibold">메모</th>
                  <th style={{ width: "12%" }} className="p-2 text-center font-semibold">영수증</th>
                  <th style={{ width: "6%" }} className="p-2 text-center font-semibold" />
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[#f1f1ef]">
                  <td className="p-2.5 text-center">
                    <span className="rounded-md bg-[#fdece3] px-2.5 py-1 font-semibold text-[#9a5b2e]">가스비</span>
                  </td>
                  <td className="p-2.5 text-center text-[#37352f]">7/1</td>
                  <td className="p-2.5 text-center text-[#37352f]">7/31</td>
                  <td className="p-2.5 text-right font-semibold text-[#1a1a1a]">68,000원</td>
                  <td className="p-2.5 text-left text-[#6b6b62]">7월 도시가스 고지서</td>
                  <td className="p-2.5 text-center text-[#2f6f52]">📎 첨부됨</td>
                  <td />
                </tr>
                <tr>
                  <td className="p-2.5 text-center">
                    <span className="rounded-md bg-[#fef6da] px-2.5 py-1 font-semibold text-[#8a6f10]">전기세</span>
                  </td>
                  <td className="p-2.5 text-center text-[#37352f]">7/1</td>
                  <td className="p-2.5 text-center text-[#37352f]">7/31</td>
                  <td className="p-2.5 text-right font-semibold text-[#1a1a1a]">92,000원</td>
                  <td className="p-2.5 text-left text-[#6b6b62]" />
                  <td className="p-2.5 text-center text-[#c0433a]">업로드 실패</td>
                  <td />
                </tr>
              </tbody>
            </table>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-[#e3e1db] bg-[rgba(255,255,255,0.92)] px-6 py-3 text-center text-[13px] font-semibold whitespace-nowrap text-[#6b6b62] shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
                아직 입력된 관리비 항목이 없어요
              </div>
            </div>
          </div>

          <div className="relative md:hidden">
            <div className="pointer-events-none blur-[3px] opacity-55 select-none">
              <div className="border-b border-[#f1f1ef] py-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="rounded-md bg-[#fdece3] px-2.5 py-1 text-[11.5px] font-semibold text-[#9a5b2e]">
                    가스비
                  </span>
                  <span className="text-sm font-extrabold text-[#1a1a1a]">68,000원</span>
                </div>
                <div className="text-xs text-[#6b6b62]">7월 도시가스 고지서</div>
              </div>
              <div className="py-2.5">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="rounded-md bg-[#fef6da] px-2.5 py-1 text-[11.5px] font-semibold text-[#8a6f10]">
                    전기세
                  </span>
                  <span className="text-sm font-extrabold text-[#1a1a1a]">92,000원</span>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg border border-[#e3e1db] bg-[rgba(255,255,255,0.92)] px-6 py-3 text-center text-[13px] font-semibold whitespace-nowrap text-[#6b6b62] shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
                아직 입력된 지출 항목이 없어요
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <table className="hidden w-full table-fixed border-collapse text-[13px] md:table">
            <thead>
              <tr className="border-b border-[#edece9] text-[#9b9a97]">
                <th style={{ width: "14%" }} className="p-2 text-center font-semibold">항목</th>
                <th style={{ width: "16%" }} className="p-2 text-center font-semibold">시작일/구매일</th>
                <th style={{ width: "16%" }} className="p-2 text-center font-semibold">종료일</th>
                <th style={{ width: "14%" }} className="p-2 text-center font-semibold">금액</th>
                <th style={{ width: "22%" }} className="p-2 text-center font-semibold">메모</th>
                <th style={{ width: "12%" }} className="p-2 text-center font-semibold">영수증</th>
                <th style={{ width: "6%" }} className="p-2 text-center font-semibold" />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) =>
                editingId === e.id ? (
                  <tr key={e.id} className="border-b border-[#f1f1ef] bg-[#fafaf8]">
                    <td className="p-1.5 text-center align-middle">{categorySelect}</td>
                    <td className="relative p-1 text-center align-middle">{startDatePopover}</td>
                    <td className="relative p-1 text-center align-middle">{endDatePopover}</td>
                    <td className="p-1.5 text-right align-middle">{amountInput}</td>
                    <td className="p-1.5 text-left align-middle">{memoTextarea}</td>
                    <td className="p-1.5 text-center align-middle">{receiptToggleButton}</td>
                    <td className="p-1.5 text-center align-middle">{saveCancelButtons}</td>
                  </tr>
                ) : (
                  <tr key={e.id} className="border-b border-[#f1f1ef]">
                    <td className="p-2.5 text-center">
                      <span
                        className="rounded-md px-2.5 py-1 text-[13px] font-semibold"
                        style={{ background: CATEGORY_META[e.category].bg, color: CATEGORY_META[e.category].color }}
                      >
                        {e.category}
                      </span>
                    </td>
                    <td className="p-2.5 text-center text-[#37352f]">{formatDate(e.startDate)}</td>
                    <td className="p-2.5 text-center text-[#37352f]">{formatDate(e.endDate)}</td>
                    <td className="p-2.5 text-right font-semibold text-[#1a1a1a]">{formatWon(e.amount)}</td>
                    <td className="p-2.5 text-left text-[#6b6b62]">{e.memo}</td>
                    <td className="p-2.5 text-center">
                      {e.receiptState === "uploaded" && (
                        <span
                          onClick={() => setPreviewCategory(e.category)}
                          className="cursor-pointer text-[#2f6f52] underline"
                        >
                          📎 첨부됨
                        </span>
                      )}
                      {e.receiptState === "error" && <span className="text-[#c0433a]">업로드 실패</span>}
                      {e.receiptState === "none" && <span className="text-[#a8a89c]">-</span>}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-0.5">
                        <IconButton icon={Pencil} label="관리비 항목 수정" onClick={() => startEdit(e)} />
                        <IconButton icon={Trash2} label="관리비 항목 삭제" variant="danger" onClick={() => requestDelete(e.id)} />
                      </div>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="p-3 text-center font-bold text-[#1a1a1a]">합계</td>
                <td className="p-3 text-right font-extrabold text-[#2f6f52]">{formatWon(total)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>

          {showForm && !editingId && (
            <table className="mt-1.5 hidden w-full table-fixed border-collapse text-[13px] md:table">
              <tbody>
                <tr className="bg-[#fafaf8]">
                  <td style={{ width: "14%" }} className="p-1.5 text-center align-middle">
                    {categorySelect}
                  </td>
                  <td style={{ width: "16%" }} className="relative p-1 text-center align-middle">
                    {startDatePopover}
                  </td>
                  <td style={{ width: "16%" }} className="relative p-1 text-center align-middle">
                    {endDatePopover}
                  </td>
                  <td style={{ width: "14%" }} className="p-1.5 text-right align-middle">
                    {amountInput}
                  </td>
                  <td style={{ width: "22%" }} className="p-1.5 text-left align-middle">
                    {memoTextarea}
                  </td>
                  <td style={{ width: "12%" }} className="p-1.5 text-center align-middle">
                    {receiptToggleButton}
                  </td>
                  <td style={{ width: "6%" }} className="p-1.5 text-center align-middle">
                    {saveCancelButtons}
                  </td>
                </tr>
              </tbody>
            </table>
          )}

          <div className="flex flex-col md:hidden">
            {expenses.map((e) => (
              <div key={e.id} className="border-b border-[#f1f1ef] py-2.5">
                {editingId === e.id ? (
                  <div className="flex flex-col gap-2">{mobileEditFields}</div>
                ) : (
                  <>
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span
                          className="rounded-md px-2.5 py-1 text-[11.5px] font-semibold"
                          style={{ background: CATEGORY_META[e.category].bg, color: CATEGORY_META[e.category].color }}
                        >
                          {e.category}
                        </span>
                        <span className="text-xs whitespace-nowrap text-[#9b9a97]">
                          {formatDate(e.startDate)}
                          {e.endDate ? ` ~ ${formatDate(e.endDate)}` : ""}
                        </span>
                      </div>
                      <span className="text-sm font-extrabold text-[#1a1a1a]">{formatWon(e.amount)}</span>
                    </div>
                    {e.memo && <div className="text-xs text-[#6b6b62]">{e.memo}</div>}
                    <div className="mt-2 flex items-baseline justify-between">
                      <span>
                        {e.receiptState === "uploaded" && (
                          <span
                            onClick={() => setPreviewCategory(e.category)}
                            className="cursor-pointer text-xs text-[#2f6f52] underline"
                          >
                            📎 첨부됨
                          </span>
                        )}
                        {e.receiptState === "error" && <span className="text-[11.5px] text-[#c0433a]">업로드 실패</span>}
                        {e.receiptState === "none" && <span className="text-[11.5px] text-[#a8a89c]">영수증 없음</span>}
                      </span>
                      <span className="inline-flex items-center gap-0.5">
                        <IconButton icon={Pencil} label="관리비 항목 수정" onClick={() => startEdit(e)} />
                        <IconButton icon={Trash2} label="관리비 항목 삭제" variant="danger" onClick={() => requestDelete(e.id)} />
                      </span>
                    </div>
                  </>
                )}
              </div>
            ))}
            {showForm && !editingId && (
              <div className="flex flex-col gap-2 bg-[#fafaf8] py-2.5">{mobileEditFields}</div>
            )}
            <div className="mt-2.5 flex justify-between pt-2.5">
              <span className="font-bold text-[#1a1a1a]">합계</span>
              <span className="font-extrabold text-[#2f6f52]">{formatWon(total)}</span>
            </div>
          </div>
        </>
      )}

      <Modal
        open={pendingDeleteId !== null}
        title="지출 항목을 삭제할까요?"
        description={`'${pendingDeleteItem?.category ?? ""}' 항목이 이번달 관리비 지출 내역에서 삭제돼요.`}
        confirmLabel="삭제"
        cancelAriaLabel="관리비 항목 삭제 취소"
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

      {previewCategory !== null && (
        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-[rgba(20,22,18,0.45)]"
          onClick={() => setPreviewCategory(null)}
        >
          <div
            className="w-[360px] rounded-xl bg-white p-5 shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-bold text-[#1a1a1a]">{previewCategory} 영수증</div>
              <button
                type="button"
                onClick={() => setPreviewCategory(null)}
                aria-label="영수증 미리보기 닫기"
                className="cursor-pointer border-none bg-transparent text-base text-[#6b6b62]"
              >
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- mock 미리보기 전용 외부 placeholder 이미지, next/image 원격 도메인 설정 불필요 */}
            <img
              src="https://picsum.photos/seed/receipt/480/640"
              alt={`${previewCategory} 영수증`}
              className="block w-full rounded-lg"
            />
          </div>
        </div>
      )}

      <Modal
        open={showUnsavedAlert}
        title="작성중인 행이 있어요!"
        description="저장 혹은 취소 후 다음 작업을 진행해주세요."
        confirmLabel="확인"
        cancelAriaLabel="편집 경고 확인 취소"
        onConfirm={() => setShowUnsavedAlert(false)}
        onCancel={() => setShowUnsavedAlert(false)}
      />
    </div>
  );
}
