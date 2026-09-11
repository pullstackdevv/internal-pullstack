<?php

namespace App\Modules\Users\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($this->route('user'))],
            'password' => ['nullable', 'string', 'min:8'],
            'role' => ['required', 'in:admin,staff'],
            'is_active' => ['required', 'boolean'],
            'module_access' => ['array'],
            'module_access.*.module' => ['required_with:module_access', 'in:docs,invoice'],
            'module_access.*.level' => ['required_with:module_access', 'in:view,manage'],
        ];
    }
}
