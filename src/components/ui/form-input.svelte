<script lang="ts">
    export let type: string; // Setting Type
    export let key: string;
    export let value: unknown;
    export let onValueChange: (key: string, value: unknown) => void = () => {};

    // Optional parameters
    export let placeholder: string = "";
    export let options: { [key: string | number]: string } = {};
    export let slider: {
        min: number;
        max: number;
        step: number;
    } = { min: 0, max: 100, step: 1 };
    export let button: {
        label: string;
        callback?: () => void;
    } = { label: value as string, callback: () => {} };
    export let fnSize: boolean = true; // If the form input is used within setting panel context, it is usually given a fixed width by a class named "fn__size200".
    export let style: string = ""; // Custom style

    const handleChange = (newValue: unknown) => {
        onValueChange(key, newValue);
    };
</script>

{#if type === "checkbox"}
    <!-- Checkbox -->
    <input
        class="b3-switch fn__flex-center"
        id={key}
        type="checkbox"
        bind:checked={value as boolean}
        on:change={() => handleChange(value)}
        style={style}
    />
{:else if type === "textinput"}
    <!-- Text Input -->
    <input
        class:b3-text-field={true}
        class:fn__flex-center={true}
        class:fn__size200={fnSize}
        id={key}
        {placeholder}
        bind:value={value}
        on:change={() => handleChange(value)}
        style={style}
    />
{:else if type === "textarea"}
    <textarea
        class="b3-text-field fn__block"
        style={`resize: vertical; height: 10em; white-space: nowrap; ${style}`}
        bind:value={value}
        on:change={() => handleChange(value)}
    >{value}</textarea>
{:else if type === "number"}
    <input
        class:b3-text-field={true}
        class:fn__flex-center={true}
        class:fn__size200={fnSize}
        id={key}
        type="number"
        bind:value={value}
        on:change={() => handleChange(value)}
        style={style}
    />
{:else if type === "button"}
    <!-- Button Input -->
    <button
        class:b3-button={true}
        class:b3-button--outline={true}
        class:fn__flex-center={true}
        class:fn__size200={fnSize}
        id={key}
        on:click={() => button?.callback()}
        style={style}
    >
        {button.label}
    </button>
{:else if type === "select"}
    <!-- Dropdown select -->
    <select
        class:b3-select={true}
        class:fn__flex-center={true}
        class:fn__size200={fnSize}
        id="iconPosition"
        bind:value={value}
        on:change={() => handleChange(value)}
        style={style}
    >
        {#each Object.entries(options) as [value, text]}
            <option {value}>{text}</option>
        {/each}
    </select>
{:else if type == "slider"}
    <!-- Slider -->
    <div class="b3-tooltips b3-tooltips__n" aria-label={value as string}>
        <input
            class:b3-slider={true}
            class:fn__size200={fnSize}
            id="fontSize"
            min={slider.min}
            max={slider.max}
            step={slider.step}
            type="range"
            bind:value={value}
            on:change={() => handleChange(value)}
            style={style}
        />
    </div>
{/if}