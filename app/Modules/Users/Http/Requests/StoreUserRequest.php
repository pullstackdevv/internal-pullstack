<?php

namespace App\Modules\Users\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'in:admin,staff'],
            'module_access' => ['array'],
            'module_access.*.module' => ['required_with:module_access', 'in:docs,invoice'],
            'module_access.*.level' => ['required_with:module_access', 'in:view,manage'],
        ];
    }
}
