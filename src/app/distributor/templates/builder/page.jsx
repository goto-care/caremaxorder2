'use client';
import dynamic from 'next/dynamic';

// FormBuilderはクライアントサイドでのみ動作するため、動的インポートを使用
const FormBuilder = dynamic(
    () => import('@/components/formBuilder/FormBuilder'),
    { ssr: false }
);

export default function BuilderPage() {
    const handleSave = (layout) => {
        console.log('保存されたレイアウト:', layout);
        // 実際のFirestore保存処理はここに追加
    };

    return (
        <FormBuilder
            onSave={handleSave}
        />
    );
}
