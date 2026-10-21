<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('money_budgets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('money_categories')->cascadeOnDelete();
            $table->char('month', 7); // YYYY-MM
            $table->unsignedBigInteger('amount');
            $table->timestamps();

            $table->unique(['category_id', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_budgets');
    }
};
