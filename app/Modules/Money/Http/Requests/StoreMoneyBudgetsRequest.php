<?php

namespace App\Modules\Money\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMoneyBudgetsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'month' => ['required', 'date_format:Y-m'],
            'budgets' => ['present', 'array'],
            'budgets.*.category_id' => ['required', 'exists:money_categories,id'],
            'budgets.*.amount' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
