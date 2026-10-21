<?php

namespace App\Modules\Money\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMoneyWalletRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', 'in:cash,bank,ewallet,other'],
            'opening_balance' => ['nullable', 'integer'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
