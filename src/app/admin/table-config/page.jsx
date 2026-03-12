'use client';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import TableConfigEditor from '@/components/tableConfigEditor/TableConfigEditor';

function TableConfigContent() {
    const searchParams = useSearchParams();
    const formatId = searchParams.get('formatId');
    const fieldId = searchParams.get('fieldId');

    return (
        <div className="tc-page">
            <TableConfigEditor formatId={formatId} fieldId={fieldId} />
        </div>
    );
}

export default function TableConfigPage() {
    return (
        <Suspense fallback={<div className="tc-loading"><p>読み込み中...</p></div>}>
            <TableConfigContent />
        </Suspense>
    );
}
