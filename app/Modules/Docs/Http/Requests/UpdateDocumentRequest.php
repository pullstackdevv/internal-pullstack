<?php

namespace App\Modules\Docs\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateDocumentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'doc_category_id' => ['required', 'exists:doc_categories,id'],
            'title' => ['required', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'body_markdown' => ['required', 'string'],
            'is_published' => ['boolean'],
        ];
    }
}
