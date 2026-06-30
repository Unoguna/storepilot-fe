import { CategoryUploadCard } from "@/components/features/category/category-upload-card";
import { MyCategoryMappingCard } from "@/components/features/my-category/my-category-mapping-card";
import { ProductExcelCard } from "@/components/features/product/product-excel-card";
import { TrainingProductUploadCard } from "@/components/features/training-product/training-product-upload-card";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f5f7f6] px-4 py-8 text-[#172126] sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-8">
        <section className="grid gap-4">
          <p className="text-sm font-extrabold uppercase tracking-normal text-teal-700">StorePilot MVP</p>
          <div className="grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-end">
            <h1 className="max-w-3xl text-3xl font-black leading-tight tracking-normal sm:text-4xl">
              카테고리 기준을 갱신하고 상품 엑셀을 자동 완성합니다
            </h1>
            <p className="text-base leading-7 text-slate-600">
              네이버 카테고리, 사용자별 마이카테고리 매칭, 기존 상품 학습 데이터, 상품 엑셀 처리를 순서대로 실행할 수 있습니다.
            </p>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <CategoryUploadCard />
          <MyCategoryMappingCard />
          <TrainingProductUploadCard />
          <ProductExcelCard />
        </section>
      </div>
    </main>
  );
}
