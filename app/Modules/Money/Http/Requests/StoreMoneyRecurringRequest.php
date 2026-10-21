<?php

namespace App\Modules\Money\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMoneyRecurringRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'wallet_id' => ['required', 'exists:money_wallets,id'],
            'category_id' => ['nullable', 'exists:money_categories,id'],
            'type' => ['required', 'in:income,expense'],
            'amount' => ['required', 'integer', 'min:1'],
            'day_of_month' => ['required', 'integer', 'min:1', 'max:28'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
