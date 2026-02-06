'use client';
import dynamic from 'next/dynamic';

// クライアントサイドでのみレンダリング（ドラッグ機能のため）
const A4FormBuilder = dynamic(
    () => import('@/components/formBuilder/A4FormBuilder'),
    { ssr: false }
);

export default function FacilityTemplateBuilderPage() {
    return <A4FormBuilder />;
}
