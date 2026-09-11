<?php

namespace App\Modules\Docs\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDocCategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:500'],
        ];
    }
}
