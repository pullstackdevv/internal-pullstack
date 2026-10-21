<?php

namespace App\Modules\Money\Http\Requests;

use App\Modules\Money\Models\MoneyCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreMoneyTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'wallet_id' => ['required', 'exists:money_wallets,id'],
            'category_id' => ['nullable', 'exists:money_categories,id'],
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'integer', 'min:1'],
            'date' => ['required', 'date'],
            'note' => ['nullable', 'string', 'max:255'],
            'invoice_id' => ['nullable', 'exists:invoices,id'],
            'mark_paid' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $categoryId = $this->input('category_id');
            $type = $this->input('type');

            if ($categoryId && $type) {
                $category = MoneyCategory::find($categoryId);
                if ($category && $category->kind !== $type) {
                    $validator->errors()->add('category_id', 'Kategori harus sesuai dengan tipe transaksi.');
                }
            }
        });
    }
}
