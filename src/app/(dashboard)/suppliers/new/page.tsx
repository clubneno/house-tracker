import { SupplierForm } from "@/components/forms/supplier-form";
import { NewSupplierHeader } from "@/components/suppliers/new-supplier-header";

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <NewSupplierHeader />
      <SupplierForm />
    </div>
  );
}
