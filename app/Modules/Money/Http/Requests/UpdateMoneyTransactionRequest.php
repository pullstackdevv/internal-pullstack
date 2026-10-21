<?php

namespace App\Modules\Money\Http\Requests;

use App\Modules\Money\Models\MoneyCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateMoneyTransactionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'wallet_id' => ['sometimes', 'exists:money_wallets,id'],
            'category_id' => ['sometimes', 'nullable', 'exists:money_categories,id'],
            'type' => ['sometimes', 'in:income,expense'],
            'amount' => ['sometimes', 'integer', 'min:1'],
            'date' => ['sometimes', 'date'],
            'note' => ['sometimes', 'nullable', 'string', 'max:255'],
            'invoice_id' => ['sometimes', 'nullable', 'exists:invoices,id'],
            'mark_paid' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $transaction = $this->route('transaction');
            $categoryId = $this->input('category_id', $transaction?->category_id);
            $type = $this->input('type', $transaction?->type);

            if ($categoryId && $type) {
                $category = MoneyCategory::find($categoryId);
                if ($category && $category->kind !== $type) {
                    $validator->errors()->add('category_id', 'Kategori harus sesuai dengan tipe transaksi.');
                }
            }
        });
    }
}
