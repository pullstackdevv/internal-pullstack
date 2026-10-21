<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('money_categories', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('kind'); // income|expense
            $table->string('color', 9)->default('#64748b');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['name', 'kind']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_categories');
    }
};
