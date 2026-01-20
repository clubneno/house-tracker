import { SupplierForm } from "@/components/forms/supplier-form";

export default function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Add Supplier</h1>
        <p className="text-muted-foreground">
          Add a new supplier or contractor
        </p>
      </div>

      <SupplierForm />
    </div>
  );
}
