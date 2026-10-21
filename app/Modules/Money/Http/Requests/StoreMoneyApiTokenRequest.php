<?php

namespace App\Modules\Money\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMoneyApiTokenRequest extends FormRequest
{
    public const ABILITIES = ['money:read', 'money:write', 'money:export', 'money:admin'];

    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'abilities' => ['required', 'array', 'min:1'],
            'abilities.*' => ['in:'.implode(',', self::ABILITIES)],
        ];
    }
}
