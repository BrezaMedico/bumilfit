import React from 'react';

export const PageSkeletonLoader: React.FC = () => {
  return (
    <div className="w-full min-h-[70vh] px-4 sm:px-6 lg:px-8 py-6 max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-pulse">
      {/* Skeleton Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-3.5 w-20 bg-slate-200 rounded-full" />
        <div className="h-3 w-3 bg-slate-200 rounded-full" />
        <div className="h-3.5 w-28 bg-slate-200 rounded-full" />
      </div>

      {/* Skeleton Hero Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 shrink-0" />
          <div className="flex-1 space-y-3 w-full text-center sm:text-left">
            <div className="h-6 sm:h-8 bg-slate-200 rounded-xl w-3/4 max-w-xs mx-auto sm:mx-0" />
            <div className="h-4 bg-slate-200/80 rounded-full w-1/2 max-w-sm mx-auto sm:mx-0" />
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <div className="h-6 w-24 bg-slate-200/70 rounded-full" />
              <div className="h-6 w-32 bg-slate-200/70 rounded-full" />
            </div>
          </div>
          <div className="w-full sm:w-auto flex justify-center sm:justify-end">
            <div className="h-10 w-32 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Skeleton Konten 2 Kolom */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
              <div className="h-3 bg-slate-200/70 rounded-full w-3/4" />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-16 bg-slate-100/90 rounded-2xl border border-slate-200/60" />
            <div className="h-16 bg-slate-100/90 rounded-2xl border border-slate-200/60" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            <div className="w-10 h-10 rounded-2xl bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-4 bg-slate-200 rounded-lg w-1/2" />
              <div className="h-3 bg-slate-200/70 rounded-full w-3/4" />
            </div>
          </div>
          <div className="space-y-3 pt-2">
            <div className="h-16 bg-slate-100/90 rounded-2xl border border-slate-200/60" />
            <div className="h-16 bg-slate-100/90 rounded-2xl border border-slate-200/60" />
          </div>
        </div>
      </div>

      {/* Skeleton Kartu Tambahan Bawah */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-slate-200 shrink-0" />
          <div className="space-y-1.5 flex-1">
            <div className="h-4 bg-slate-200 rounded-lg w-1/3" />
            <div className="h-3 bg-slate-200/70 rounded-full w-1/2" />
          </div>
        </div>
        <div className="h-24 bg-slate-100/80 rounded-2xl border border-slate-200/60" />
      </div>
    </div>
  );
};
