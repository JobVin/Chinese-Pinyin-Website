/**
 * HanziDrawing - Freehand Canvas & Shape Grading Utility
 * Provides drawable canvas component, trace mode overlay, and shape-matching grading.
 */
(function (window) {
  'use strict';

  // Named constants for tuning grading thresholds
  const GRADE_THRESHOLD = 0.65;
  const PENALTY_PER_EXTRA_STROKE = 0.05;
  const NUM_RESAMPLE_POINTS = 12;
  const MAX_MATCH_DISTANCE = 0.35;

  // Authentic vector path & median datasets for all 29 standard Chinese stroke symbols
  const CUSTOM_STROKE_DATABASE = {
  "一": {
    "strokes": [
      "M 518 382 Q 572 385 623 389 Q 758 399 900 383 Q 928 379 935 390 Q 944 405 930 419 Q 896 452 845 475 Q 829 482 798 473 Q 723 460 480 434 Q 180 409 137 408 Q 130 408 124 408 Q 108 408 106 395 Q 105 380 127 363 Q 146 348 183 334 Q 195 330 216 338 Q 232 344 306 354 Q 400 373 518 382 Z"
    ],
    "medians": [
      [
        [
          121,
          393
        ],
        [
          193,
          372
        ],
        [
          417,
          402
        ],
        [
          827,
          434
        ],
        [
          920,
          401
        ]
      ]
    ]
  },
  "丨": {
    "strokes": [
      "M 445 104 Q 435 62 462 -1 Q 469 -20 477 -23 Q 484 -30 491 -21 Q 500 -17 510 5 Q 520 32 519 64 Q 518 113 519 571 Q 519 665 536 730 Q 546 746 542 760 Q 535 770 477 805 Q 452 821 431 806 Q 425 800 432 784 Q 465 738 466 681 Q 482 245 445 104 Z"
    ],
    "medians": [
      [
        [
          444,
          797
        ],
        [
          473,
          775
        ],
        [
          497,
          744
        ],
        [
          496,
          379
        ],
        [
          490,
          192
        ],
        [
          480,
          83
        ],
        [
          482,
          -9
        ]
      ]
    ]
  },
  "丿": {
    "strokes": [
      "M 241 676 Q 256 264 118 111 Q 93 84 57 51 Q 44 44 41 39 Q 37 32 54 32 Q 93 32 178 111 Q 298 228 298 556 Q 298 649 317 712 Q 321 725 312 733 Q 291 749 253 764 Q 229 774 211 767 Q 190 758 208 740 Q 239 709 241 676 Z"
    ],
    "medians": [
      [
        [
          214,
          753
        ],
        [
          249,
          735
        ],
        [
          269,
          716
        ],
        [
          275,
          701
        ],
        [
          265,
          442
        ],
        [
          247,
          319
        ],
        [
          222,
          234
        ],
        [
          178,
          149
        ],
        [
          114,
          79
        ],
        [
          48,
          37
        ]
      ]
    ]
  },
  "乀": {
    "strokes": [
      "M 446 687 Q 507 636 530 577 Q 608 343 711 190 Q 732 163 846 151 Q 892 147 958 141 Q 983 140 984 146 Q 984 152 963 163 Q 756 269 675 396 Q 621 480 551 644 Q 530 690 483 702 Q 449 709 445 702 Q 438 692 446 687 Z"
    ],
    "medians": [
      [
        [
          452,
          695
        ],
        [
          484,
          681
        ],
        [
          525,
          640
        ],
        [
          645,
          378
        ],
        [
          693,
          302
        ],
        [
          755,
          227
        ],
        [
          839,
          190
        ],
        [
          978,
          147
        ]
      ]
    ]
  },
  "丶": {
    "strokes": [
      "M 387 680 Q 463 595 550 475 Q 566 450 582 443 Q 592 440 601 451 Q 617 464 609 515 Q 600 587 393 715 Q 383 722 379 708 Q 376 693 387 680 Z"
    ],
    "medians": [
      [
        [
          391,
          701
        ],
        [
          542,
          554
        ],
        [
          571,
          512
        ],
        [
          586,
          460
        ]
      ]
    ]
  },
  "㇀": {
    "strokes": [
      "M 403 190 Q 390 187 391 169 Q 404 88 436 70 Q 442 63 453 64 Q 462 65 464 91 Q 471 133 591 395 Q 600 411 599 418 Q 598 428 589 422 Q 579 416 447 231 Q 432 210 403 190 Z"
    ],
    "medians": [
      [
        [
          449,
          75
        ],
        [
          437,
          117
        ],
        [
          439,
          160
        ],
        [
          592,
          416
        ]
      ]
    ]
  },
  "㇇": {
    "strokes": [
      "M 532 313 Q 539 325 549 337 Q 616 430 658 564 Q 673 612 708 643 Q 730 662 711 678 Q 686 696 653 704 Q 626 716 551 686 Q 404 646 283 635 Q 262 635 258 629 Q 254 616 280 599 Q 311 578 384 603 Q 568 658 589 652 Q 601 652 601 632 Q 568 473 491 354 L 468 322 Q 438 288 405 254 Q 317 175 148 91 Q 130 82 140 76 Q 147 72 175 81 Q 400 151 503 276 L 532 313 Z"
    ],
    "medians": [
      [
        [
          266,
          625
        ],
        [
          310,
          613
        ],
        [
          349,
          618
        ],
        [
          590,
          676
        ],
        [
          630,
          669
        ],
        [
          648,
          653
        ],
        [
          578,
          447
        ],
        [
          522,
          348
        ],
        [
          477,
          289
        ],
        [
          422,
          233
        ],
        [
          338,
          172
        ],
        [
          233,
          116
        ],
        [
          145,
          82
        ]
      ]
    ]
  },
  "𠃍": {
    "strokes": [
      "M 719 261 Q 755 472 821 538 Q 845 563 824 589 Q 802 607 729 642 Q 704 652 674 641 Q 515 587 295 571 C 265 569 293 522 322 528 Q 331 529 345 533 Q 493 555 634 577 Q 671 584 685 568 Q 707 549 703 505 Q 684 372 654 268 C 646 239 714 231 719 261 Z"
    ],
    "medians": [
      [
        [
          304,
          569
        ],
        [
          333,
          552
        ],
        [
          488,
          574
        ],
        [
          663,
          608
        ],
        [
          700,
          607
        ],
        [
          720,
          598
        ],
        [
          759,
          559
        ],
        [
          758,
          552
        ],
        [
          694,
          295
        ],
        [
          661,
          273
        ]
      ]
    ]
  },
  "㇍": {
    "strokes": [
      "M 451 344 Q 358 200 161 80 Q 148 73 133 63 Q 118 53 129 49 Q 136 43 150 47 Q 277 75 411 213 Q 432 237 477 282 C 541 346 472 375 451 344 Z"
    ],
    "medians": [
      [
        [
          472,
          340
        ],
        [
          461,
          327
        ],
        [
          449,
          292
        ],
        [
          348,
          186
        ],
        [
          236,
          102
        ],
        [
          136,
          54
        ]
      ]
    ]
  },
  "𠃌": {
    "strokes": [
      "M 420 735 Q 429 735 609 769 Q 631 773 637 762 Q 656 713 657 390 Q 657 128 640 101 Q 634 94 612 99 Q 581 105 549 111 Q 527 117 528 107 Q 595 55 633 16 Q 649 -3 665 -9 Q 675 -13 685 -2 Q 730 53 725 113 Q 712 321 709 657 Q 708 721 723 750 Q 736 772 723 783 Q 698 804 658 820 Q 639 827 621 820 Q 569 793 536 785 Q 493 773 405 766 C 375 763 390 730 420 735 Z"
    ],
    "medians": [
      [
        [
          415,
          764
        ],
        [
          429,
          752
        ],
        [
          503,
          762
        ],
        [
          634,
          796
        ],
        [
          666,
          780
        ],
        [
          681,
          758
        ],
        [
          687,
          291
        ],
        [
          683,
          93
        ],
        [
          664,
          56
        ],
        [
          632,
          63
        ],
        [
          538,
          104
        ]
      ]
    ]
  },
  "乛": {
    "strokes": [
      "M 260 650 Q 279 641 336 651 Q 474 691 701 706 Q 725 707 737 705 Q 755 692 752 684 Q 752 681 721 603 Q 714 590 721 585 Q 728 581 745 594 Q 800 636 846 651 Q 885 666 883 675 Q 882 685 808 737 Q 787 753 713 741 Q 563 725 367 695 Q 315 688 265 683 C 235 680 231 656 260 650 Z"
    ],
    "medians": [
      [
        [
          266,
          655
        ],
        [
          281,
          665
        ],
        [
          497,
          701
        ],
        [
          748,
          725
        ],
        [
          786,
          706
        ],
        [
          800,
          684
        ],
        [
          726,
          592
        ]
      ]
    ]
  },
  "㇈": {
    "strokes": [
      "M 873 94 Q 904 107 894 147 Q 875 205 863 295 Q 862 313 854 322 Q 847 331 841 305 Q 828 226 810 175 Q 798 150 772 136 Q 634 76 381 108 Q 345 115 324 129 Q 287 150 281 180 Q 253 270 379 434 Q 434 507 575 635 Q 612 669 654 691 Q 670 697 673 707 Q 680 722 661 736 Q 627 760 585 772 Q 575 776 559 769 Q 474 735 426 725 Q 356 712 253 709 Q 240 710 235 702 Q 231 695 245 682 Q 261 666 278 661 Q 315 652 512 707 Q 525 711 531 704 Q 537 697 524 685 Q 260 379 237 252 Q 236 249 235 243 Q 225 186 239 148 Q 245 120 273 97 Q 375 4 674 36 Q 680 37 686 38 Q 771 48 873 94 Z"
    ],
    "medians": [
      [
        [
          244,
          698
        ],
        [
          273,
          687
        ],
        [
          323,
          687
        ],
        [
          424,
          703
        ],
        [
          522,
          732
        ],
        [
          564,
          728
        ],
        [
          585,
          714
        ],
        [
          567,
          678
        ],
        [
          436,
          540
        ],
        [
          376,
          467
        ],
        [
          313,
          376
        ],
        [
          278,
          311
        ],
        [
          254,
          231
        ],
        [
          255,
          185
        ],
        [
          270,
          140
        ],
        [
          310,
          104
        ],
        [
          358,
          82
        ],
        [
          395,
          73
        ],
        [
          503,
          63
        ],
        [
          659,
          69
        ],
        [
          728,
          82
        ],
        [
          792,
          103
        ],
        [
          846,
          138
        ],
        [
          850,
          313
        ]
      ]
    ]
  },
  "⺄": {
    "strokes": [
      "M 956 10 Q 949 89 947 222 Q 948 235 941 241 Q 934 245 930 230 Q 900 119 884 102 Q 878 93 854 104 Q 802 128 764 209 Q 731 282 721 375 Q 711 472 732 597 Q 736 640 766 674 Q 785 687 772 700 Q 760 719 725 745 Q 704 760 653 738 Q 611 732 312 661 C 283 654 294 617 323 625 Q 333 626 345 631 Q 478 668 645 692 Q 664 695 673 688 Q 676 685 677 654 Q 623 239 781 75 Q 835 9 923 -19 Q 942 -26 952 -16 Q 959 -9 956 10 Z"
    ],
    "medians": [
      [
        [
          327,
          633
        ],
        [
          335,
          648
        ],
        [
          449,
          677
        ],
        [
          672,
          718
        ],
        [
          704,
          712
        ],
        [
          720,
          690
        ],
        [
          703,
          617
        ],
        [
          692,
          515
        ],
        [
          692,
          387
        ],
        [
          706,
          292
        ],
        [
          746,
          177
        ],
        [
          785,
          118
        ],
        [
          821,
          82
        ],
        [
          867,
          55
        ],
        [
          899,
          50
        ],
        [
          922,
          109
        ],
        [
          938,
          233
        ]
      ]
    ]
  },
  "㇡": {
    "strokes": [
      "M 422 669 Q 425 639 415 600 Q 348 441 316 378 Q 232 252 95 132 Q 88 128 84 122 Q 78 112 89 111 Q 123 110 235 198 Q 253 216 273 236 Q 372 345 446 513 Q 470 571 490 603 Q 503 615 500 630 Q 490 652 463 676 Q 462 677 461 678 C 439 699 421 699 422 669 Z"
    ],
    "medians": [
      [
        [
          430,
          663
        ],
        [
          452,
          645
        ],
        [
          459,
          625
        ],
        [
          394,
          472
        ],
        [
          344,
          373
        ],
        [
          294,
          301
        ],
        [
          211,
          208
        ],
        [
          148,
          155
        ],
        [
          92,
          119
        ]
      ]
    ]
  },
  "𠄎": {
    "strokes": [
      "M 537 206 Q 429 113 290 64 Q 262 58 264 53 Q 265 40 339 57 Q 469 87 573 163 L 618 204 Q 687 280 712 379 Q 728 425 754 446 Q 758 450 758 460 Q 755 484 698 514 Q 676 523 648 510 Q 638 503 606 493 Q 572 484 600 539 Q 622 579 668 665 Q 684 690 702 701 Q 723 711 727 722 Q 731 737 686 764 Q 632 794 594 772 Q 422 717 259 712 Q 234 712 235 700 Q 236 690 269 677 Q 302 665 376 685 L 419 694 Q 483 707 584 725 Q 605 729 609 718 Q 615 697 559 563 Q 540 535 521 515 Q 505 497 513 480 Q 520 464 532 454 Q 542 447 550 447 Q 557 447 573 455 Q 582 461 609 466 Q 642 466 653 452 Q 663 439 648 395 Q 624 296 573 243 L 537 206 Z"
    ],
    "medians": [
      [
        [
          244,
          701
        ],
        [
          313,
          694
        ],
        [
          611,
          751
        ],
        [
          637,
          743
        ],
        [
          655,
          721
        ],
        [
          551,
          491
        ],
        [
          582,
          477
        ],
        [
          675,
          481
        ],
        [
          701,
          458
        ],
        [
          675,
          366
        ],
        [
          649,
          300
        ],
        [
          610,
          240
        ],
        [
          571,
          199
        ],
        [
          504,
          147
        ],
        [
          428,
          104
        ],
        [
          332,
          69
        ],
        [
          324,
          61
        ],
        [
          269,
          54
        ]
      ]
    ]
  },
  "㇊": {
    "strokes": [
      "M 141 468 Q 92 449 63 444 Q 48 444 46 436 Q 43 426 55 420 Q 98 398 125 411 Q 266 483 268 483 Q 271 483 274 481 Q 284 475 280 450 Q 286 282 245 137 Q 229 104 272 52 Q 282 39 293 46 Q 300 53 313 78 Q 359 133 456 227 Q 469 239 466 246 Q 465 255 453 245 Q 404 214 355 179 Q 303 137 313 200 Q 312 270 335 443 Q 339 468 361 493 Q 373 503 362 516 Q 350 532 311 548 Q 298 554 282 542 Q 192 487 141 468 Z"
    ],
    "medians": [
      [
        [
          56,
          432
        ],
        [
          85,
          428
        ],
        [
          127,
          437
        ],
        [
          267,
          507
        ],
        [
          304,
          508
        ],
        [
          313,
          500
        ],
        [
          283,
          167
        ],
        [
          292,
          127
        ],
        [
          333,
          138
        ],
        [
          460,
          243
        ]
      ]
    ]
  },
  "㇋": {
    "strokes": [
      "M 250 649 Q 292 658 334 678 Q 353 688 365 677 Q 371 671 363 654 Q 347 617 335 580 Q 322 555 337 534 Q 398 444 383 423 Q 376 411 351 413 Q 318 417 284 416 Q 259 415 288 402 Q 349 377 404 342 Q 420 330 432 343 Q 447 353 453 380 Q 465 437 396 519 Q 357 558 381 595 Q 424 659 448 675 Q 469 688 458 703 Q 445 722 404 743 Q 382 752 366 739 Q 311 697 241 681 C 212 673 221 642 250 649 Z"
    ],
    "medians": [
      [
        [
          250,
          678
        ],
        [
          261,
          669
        ],
        [
          344,
          702
        ],
        [
          379,
          708
        ],
        [
          389,
          708
        ],
        [
          404,
          694
        ],
        [
          397,
          665
        ],
        [
          354,
          582
        ],
        [
          351,
          557
        ],
        [
          412,
          449
        ],
        [
          418,
          426
        ],
        [
          415,
          398
        ],
        [
          410,
          389
        ],
        [
          388,
          387
        ],
        [
          291,
          410
        ]
      ]
    ]
  },
  "亅": {
    "strokes": [
      "M 461 695 Q 483 423 458 144 Q 455 113 443 105 Q 437 99 358 97 Q 321 104 327 94 Q 330 88 377 61.5 Q 424 35 444 7.5 Q 464 -20 482 -18 Q 498 -16 509 19 Q 528 72 521 186 Q 512 335 521 578 Q 526 713 538 735 Q 555 765 493 799 Q 484 805 438 810 Q 415 813 436 779 Q 457 744 461 695 Z"
    ],
    "medians": [
      [
        [
          438,
          794
        ],
        [
          447,
          794
        ],
        [
          474,
          773
        ],
        [
          496,
          737
        ],
        [
          489,
          120
        ],
        [
          483,
          90
        ],
        [
          467,
          59
        ],
        [
          332,
          95
        ]
      ]
    ]
  },
  "㇑": {
    "strokes": [
      "M 283 725 Q 261 744 242 753 Q 220 762 210 755 Q 198 748 208 730 Q 268 604 223 214 Q 219 157 171 101 Q 158 83 165 57 Q 177 26 191 12 Q 206 2 221 21 Q 243 57 439 197 Q 461 210 468 221 Q 472 231 461 233 Q 443 233 294 158 Q 276 151 276 167 Q 294 375 293 541 L 293 574 Q 293 580 293 585 Q 292 640 301 686 Q 301 689 302 690 C 305 708 305 708 283 725 Z"
    ],
    "medians": [
      [
        [
          219,
          742
        ],
        [
          250,
          710
        ],
        [
          263,
          684
        ],
        [
          268,
          463
        ],
        [
          258,
          278
        ],
        [
          245,
          169
        ],
        [
          249,
          117
        ],
        [
          304,
          131
        ],
        [
          460,
          224
        ]
      ]
    ]
  },
  "𠃊": {
    "strokes": [
      "M 309 688 L 309 689 Q 263 714 242 716 Q 229 717 220 710 Q 210 703 224 685 Q 246 655 245 383 Q 242 149 205 73 Q 199 67 195 62 Q 173 43 186 24 Q 193 6 209 -7 Q 225 -20 245 -6 Q 252 3 318 26 Q 414 47 595 52 Q 779 55 844 46 Q 869 42 883 49 Q 895 55 895 63 Q 894 79 858 102 Q 822 123 801 122 Q 758 121 425 82 Q 298 61 288 75 Q 279 84 290 226 Q 284 257 306 546 Q 309 628 315 653 C 319 683 319 683 309 688 Z"
    ],
    "medians": [
      [
        [
          231,
          700
        ],
        [
          259,
          681
        ],
        [
          274,
          653
        ],
        [
          276,
          535
        ],
        [
          264,
          214
        ],
        [
          248,
          83
        ],
        [
          249,
          49
        ],
        [
          300,
          45
        ],
        [
          518,
          73
        ],
        [
          769,
          86
        ],
        [
          820,
          83
        ],
        [
          882,
          64
        ]
      ]
    ]
  },
  "乚": {
    "strokes": [
      "M 523 611 Q 524 608 529 604 Q 545 585 545 536 Q 546 493 546 439 Q 545 384 570 366 Q 592 345 691 351 Q 725 352 735 368 Q 745 378 738 386 Q 731 393 634 397 Q 589 400 587 441 Q 581 502 605 588 Q 609 603 601 612 Q 597 616 589 618 C 562 631 504 634 523 611 Z"
    ],
    "medians": [
      [
        [
          530,
          611
        ],
        [
          571,
          584
        ],
        [
          566,
          446
        ],
        [
          579,
          393
        ],
        [
          608,
          377
        ],
        [
          638,
          373
        ],
        [
          699,
          371
        ],
        [
          732,
          379
        ]
      ]
    ]
  },
  "㇟": {
    "strokes": [
      "M 294 470 Q 300 562 312 622 L 325 680 Q 328 694 320 704 Q 304 720 269 733 Q 224 750 211 737 Q 207 733 206 729 Q 206 723 218 705 Q 243 664 242 615 L 242 449 Q 242 220 267 179 Q 280 149 316 118 Q 398 46 664 43 Q 750 42 817 50 Q 937 63 953 95 Q 955 98 955 101 Q 956 109 947 127 Q 913 190 890 284 Q 886 296 878 304 Q 866 316 864 293 L 845 188 Q 835 147 813 130 Q 791 121 672 114 Q 548 110 456 125 Q 402 135 369 153 Q 322 177 308 229 Q 296 283 294 470 Z"
    ],
    "medians": [
      [
        [
          217,
          728
        ],
        [
          250,
          709
        ],
        [
          278,
          679
        ],
        [
          267,
          472
        ],
        [
          276,
          255
        ],
        [
          282,
          219
        ],
        [
          300,
          176
        ],
        [
          338,
          137
        ],
        [
          411,
          103
        ],
        [
          497,
          86
        ],
        [
          653,
          77
        ],
        [
          825,
          90
        ],
        [
          883,
          125
        ],
        [
          878,
          272
        ],
        [
          871,
          299
        ]
      ]
    ]
  },
  "㇉": {
    "strokes": [
      "M 320 336 Q 413 388 642 408 Q 669 411 679 401 Q 698 379 688 335 Q 672 244 627 119 Q 617 94 595 80 Q 577 74 479 107 Q 460 116 459 106 Q 458 96 479 78 Q 531 29 553 -13 Q 572 -47 601 -28 Q 661 11 686 62 Q 702 107 746 310 Q 755 359 778 379 Q 794 395 787 407 Q 775 420 723 449 Q 696 464 614 445 Q 437 417 358 396 Q 336 395 341 408 Q 362 495 379 534 C 389 562 390 564 376 574 Q 363 589 348 596 Q 323 606 314 603 Q 304 597 310 583 Q 331 541 297 437 Q 290 421 261 392 Q 249 377 258 364 Q 268 351 289 334 Q 301 324 320 336 Z"
    ],
    "medians": [
      [
        [
          319,
          593
        ],
        [
          345,
          565
        ],
        [
          349,
          540
        ],
        [
          306,
          377
        ],
        [
          359,
          375
        ],
        [
          480,
          405
        ],
        [
          650,
          431
        ],
        [
          683,
          430
        ],
        [
          702,
          423
        ],
        [
          732,
          393
        ],
        [
          674,
          147
        ],
        [
          652,
          84
        ],
        [
          634,
          57
        ],
        [
          590,
          27
        ],
        [
          466,
          104
        ]
      ]
    ]
  },
  "ㄣ": {
    "strokes": [
      "M 577 76 Q 614 119 680 208 Q 711 245 732 255 Q 754 265 755 276 Q 756 288 739 301 Q 717 320 693 332 Q 668 344 630 325 Q 534 300 470 297 Q 446 290 452 320 Q 462 375 476 431 L 485 475 Q 498 539 514 603 L 525 654 Q 543 741 563 765 Q 576 781 556 797 Q 534 813 487 832 Q 471 838 462 830 Q 452 823 467 801 Q 485 774 471 643 L 465 596 Q 461 578 459 556 Q 452 516 442 470 L 430 424 Q 402 331 388 314 Q 349 278 379 237 Q 386 225 406 239 Q 473 279 619 285 Q 644 286 644 282 L 557 91 C 545 64 558 53 577 76 Z"
    ],
    "medians": [
      [
        [
          472,
          820
        ],
        [
          518,
          772
        ],
        [
          476,
          529
        ],
        [
          418,
          286
        ],
        [
          467,
          280
        ],
        [
          651,
          307
        ],
        [
          676,
          300
        ],
        [
          690,
          281
        ],
        [
          580,
          105
        ],
        [
          575,
          84
        ]
      ]
    ]
  },
  "㇁": {
    "strokes": [
      "M 529 573 Q 505 588 486 592 Q 474 596 466 591 Q 462 587 474 574 Q 495 544 508 451 L 513 407 Q 541 169 492 90 Q 489 83 482 81 Q 467 77 356 100 Q 349 100 346 97 Q 345 93 354 85 Q 429 30 470 -13 Q 483 -26 492 -24 Q 505 -23 527 -1 Q 575 44 576 136 Q 583 239 562 411 L 557 457 Q 551 505 549 542 Q 549 554 544 561 L 529 573 Z"
    ],
    "medians": [
      [
        [
          472,
          588
        ],
        [
          516,
          549
        ],
        [
          530,
          478
        ],
        [
          550,
          263
        ],
        [
          549,
          179
        ],
        [
          537,
          99
        ],
        [
          523,
          64
        ],
        [
          505,
          42
        ],
        [
          490,
          34
        ],
        [
          383,
          79
        ],
        [
          368,
          91
        ],
        [
          353,
          93
        ]
      ]
    ]
  },
  "㇂": {
    "strokes": [
      "M 303 526 Q 255 557 229 553 Q 208 549 225 526 Q 252 486 237 289 Q 228 240 206 182 Q 184 125 108 49 Q 93 36 89 29 Q 88 22 100 22 Q 137 22 202 90 Q 266 159 291 300 Q 291 309 294 317 L 298 350 Q 302 402 306 466 Q 307 482 310 492 C 315 519 315 519 303 526 Z"
    ],
    "medians": [
      [
        [
          231,
          539
        ],
        [
          263,
          515
        ],
        [
          273,
          492
        ],
        [
          268,
          337
        ],
        [
          249,
          229
        ],
        [
          229,
          173
        ],
        [
          197,
          118
        ],
        [
          153,
          68
        ],
        [
          97,
          30
        ]
      ]
    ]
  },
  "㇃": {
    "strokes": [
      "M 863 228 Q 859 243 834 262 Q 797 290 698 391 Q 691 398 685 398 Q 682 397 684 389 Q 708 338 732 281 Q 742 257 728 241 Q 689 208 550 226 Q 441 244 397 323 Q 370 377 355 435 Q 348 463 324 476 Q 306 486 299 478 Q 295 474 302 454 Q 312 429 335 363 Q 372 224 476 178 Q 495 171 521 163 Q 710 115 851 212 Q 866 221 863 228 Z"
    ],
    "medians": [
      [
        [
          306,
          473
        ],
        [
          333,
          435
        ],
        [
          369,
          327
        ],
        [
          400,
          274
        ],
        [
          429,
          244
        ],
        [
          471,
          215
        ],
        [
          538,
          193
        ],
        [
          634,
          183
        ],
        [
          693,
          187
        ],
        [
          748,
          205
        ],
        [
          784,
          234
        ],
        [
          773,
          267
        ],
        [
          691,
          393
        ]
      ]
    ]
  },
  "㇜": {
    "strokes": [
      "M 440 550 Q 268 249 204 207 Q 147 174 163 120 Q 173 90 190 89 Q 197 90 219 104 Q 336 173 638 205 Q 675 209 735 210 C 765 211 746 240 716 240 Q 515 240 306 198 Q 258 189 286 224 Q 316 276 403 396 Q 536 583 565 605 Q 575 615 582 624 Q 586 640 562 660 Q 516 693 483 695 Q 465 695 457 687 Q 453 678 464 667 Q 471 655 475 633 Q 474 611 440 550 Z"
    ],
    "medians": [
      [
        [
          467,
          682
        ],
        [
          502,
          659
        ],
        [
          521,
          627
        ],
        [
          393,
          420
        ],
        [
          253,
          218
        ],
        [
          240,
          171
        ],
        [
          275,
          165
        ],
        [
          476,
          205
        ],
        [
          616,
          221
        ],
        [
          707,
          225
        ],
        [
          727,
          212
        ]
      ]
    ]
  },
  "𡿨": {
    "strokes": [
      "M 445 467 Q 485 576 514 665 Q 526 705 540 732 Q 562 757 524 789 Q 478 825 449 826 Q 433 827 429 815 Q 425 806 434 798 Q 455 774 453 731 Q 441 625 390 461 L 375 416 Q 348 338 337 327 Q 313 309 331 280 Q 340 270 356 274 Q 393 283 491 221 L 535 192 Q 637 132 757 11 Q 776 -8 789 -7 Q 805 -6 805 17 Q 804 54 773 100 Q 755 127 701 153 Q 599 213 569 230 L 519 256 Q 395 320 393 327 Q 393 333 427 423 L 445 467 Z"
    ],
    "medians": [
      [
        [
          442,
          810
        ],
        [
          475,
          787
        ],
        [
          498,
          746
        ],
        [
          453,
          573
        ],
        [
          373,
          346
        ],
        [
          365,
          309
        ],
        [
          498,
          244
        ],
        [
          675,
          132
        ],
        [
          740,
          81
        ],
        [
          787,
          11
        ]
      ]
    ]
  }
};


  /**
   * Default charDataLoader for HanziWriter ensuring all 29 Chinese strokes load authentic vector data.
   */
  function defaultCharDataLoader(character, onLoad, onError) {
    if (CUSTOM_STROKE_DATABASE && CUSTOM_STROKE_DATABASE[character]) {
      onLoad(CUSTOM_STROKE_DATABASE[character]);
      return;
    }
    fetch('https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/' + encodeURIComponent(character) + '.json')
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(onLoad)
      .catch(err => {
        if (typeof onError === 'function') onError(err);
      });
  }

  function injectStyles() {
    if (document.getElementById('hanzi-drawing-styles')) return;
    const styleEl = document.createElement('style');
    styleEl.id = 'hanzi-drawing-styles';
    styleEl.textContent = `
      .hanzi-drawing-word-container {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: center;
        gap: 16px;
        margin: 12px 0;
      }
      .hanzi-drawing-char-wrapper {
        display: flex;
        flex-direction: column;
        align-items: center;
        position: relative;
      }
      .hanzi-drawing-target {
        background: #ffffff;
        border: 2px solid #cbd5e1;
        border-radius: 12px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
        transition: all 0.25s ease;
        position: relative;
        overflow: hidden;
      }
      .hanzi-drawing-target.char-len-1 {
        width: 140px;
        height: 140px;
      }
      .hanzi-drawing-target.char-len-2 {
        width: 110px;
        height: 110px;
      }
      .hanzi-drawing-target.char-len-3 {
        width: 90px;
        height: 90px;
      }
      .hanzi-drawing-controls {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin-top: 12px;
        width: 100%;
      }
      .btn-hanzi-animate {
        background: linear-gradient(135deg, #1976d2 0%, #0d47a1 100%);
        color: #ffffff;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 2px 6px rgba(25, 118, 210, 0.3);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .btn-hanzi-animate:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(25, 118, 210, 0.4);
      }
      .btn-hanzi-animate:active {
        transform: translateY(0);
      }
      .btn-hanzi-canvas-clear {
        position: absolute !important;
        top: 6px !important;
        right: 6px !important;
        margin: 0 !important;
        background: rgba(51, 65, 85, 0.88) !important;
        color: #ffffff !important;
        border: none !important;
        border-radius: 6px !important;
        padding: 3px 8px !important;
        font-size: 11px !important;
        font-weight: 600 !important;
        cursor: pointer !important;
        z-index: 20 !important;
        backdrop-filter: blur(4px) !important;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
        transition: all 0.15s ease !important;
        line-height: 1.2 !important;
      }
      .btn-hanzi-canvas-clear:hover {
        background: rgba(15, 23, 42, 0.95) !important;
        transform: scale(1.05) !important;
      }
      .btn-hanzi-canvas-clear:active {
        transform: scale(0.95) !important;
      }
    `;
    document.head.appendChild(styleEl);
  }

  function getHanziTransform(options = {}) {
    const width = options.width || 140;
    const height = options.height || 140;
    const padding = (options.padding !== undefined) ? options.padding : 5;

    if (options.targetDiv || options.container) {
      const container = options.targetDiv || options.container;
      const gEl = container.querySelector('g');
      if (gEl) {
        const transformAttr = gEl.getAttribute('transform');
        if (transformAttr) {
          const translateMatch = transformAttr.match(/translate\(([^,)]+)[, ]+([^)]+)\)/);
          const scaleMatch = transformAttr.match(/scale\(([^,)]+)[, ]+([^)]+)\)/);

          if (translateMatch && scaleMatch) {
            const tx = parseFloat(translateMatch[1]);
            const ty = parseFloat(translateMatch[2]);
            const sx = parseFloat(scaleMatch[1]);
            const sy = parseFloat(scaleMatch[2]);

            return {
              translateX: tx,
              translateY: ty,
              scaleX: sx,
              scaleY: sy,
              scale: Math.abs(sx),
              xOffset: tx,
              yOffset: height - ty,
              source: 'DOM <g transform>'
            };
          }
        }
      }
    }

    const drawWidth = width - 2 * padding;
    const drawHeight = height - 2 * padding;
    const scale = Math.min(drawWidth / 1024, drawHeight / 1024);

    const xOffset = padding + (drawWidth - scale * 1024) / 2;
    const yOffset = 124 * scale + padding + (drawHeight - scale * 1024) / 2;

    return {
      translateX: xOffset,
      translateY: height - yOffset,
      scaleX: scale,
      scaleY: -scale,
      scale: scale,
      xOffset: xOffset,
      yOffset: yOffset,
      source: 'Derived Layout Engine Math'
    };
  }

  function createDrawableCanvas(containerEl, options = {}) {
    if (!containerEl) {
      throw new Error('createDrawableCanvas: containerEl is required.');
    }

    const width = options.width || containerEl.clientWidth || 140;
    const height = options.height || containerEl.clientHeight || 140;

    containerEl.style.position = containerEl.style.position || 'relative';

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    canvas.style.touchAction = 'none';
    canvas.style.display = 'block';
    canvas.style.cursor = 'crosshair';
    canvas.className = 'hanzi-drawable-canvas';

    containerEl.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    let strokes = [];
    let currentStroke = null;
    let isDrawing = false;

    const strokeColor = options.strokeColor || '#1976d2';
    const lineWidth = options.lineWidth || 6;

    function redraw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const stroke of strokes) {
        if (!stroke || stroke.length === 0) continue;
        ctx.beginPath();
        ctx.moveTo(stroke[0].x, stroke[0].y);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i].x, stroke[i].y);
        }
        ctx.stroke();
      }
    }

    function getCanvasCoords(e) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / (rect.width || canvas.width);
      const scaleY = canvas.height / (rect.height || canvas.height);
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    }

    function onPointerDown(e) {
      e.preventDefault();
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
      isDrawing = true;
      const pt = getCanvasCoords(e);
      currentStroke = [pt];

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(pt.x + 0.1, pt.y + 0.1);
      ctx.stroke();
    }

    function onPointerMove(e) {
      if (!isDrawing || !currentStroke) return;
      e.preventDefault();
      const pt = getCanvasCoords(e);
      const prevPt = currentStroke[currentStroke.length - 1];

      ctx.beginPath();
      ctx.moveTo(prevPt.x, prevPt.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();

      currentStroke.push(pt);
    }

    function onPointerUp(e) {
      if (!isDrawing) return;
      e.preventDefault();
      isDrawing = false;
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch (_) {}

      if (currentStroke && currentStroke.length > 0) {
        strokes.push(currentStroke);
      }
      currentStroke = null;
    }

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const instance = {
      canvas: canvas,
      container: containerEl,
      width: width,
      height: height,
      getStrokes: () => strokes.map(s => s.map(p => ({ x: p.x, y: p.y }))),
      clear: () => {
        strokes = [];
        currentStroke = null;
        isDrawing = false;
        redraw();
      },
      undo: () => {
        strokes.pop();
        redraw();
      },
      toWatermarkedDataURL: (watermarkText = '© Chinese Pinyin Hub • JobVin') => {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = width;
        exportCanvas.height = height;
        const expCtx = exportCanvas.getContext('2d');
        expCtx.drawImage(canvas, 0, 0);
        expCtx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        expCtx.fillStyle = 'rgba(100, 116, 139, 0.45)';
        expCtx.textAlign = 'right';
        expCtx.textBaseline = 'bottom';
        expCtx.fillText(watermarkText, width - 8, height - 6);
        return exportCanvas.toDataURL('image/png');
      }
    };

    if (options.showClearButton !== false) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn-hanzi-canvas-clear';
      clearBtn.textContent = 'Clear';
      clearBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        instance.clear();
      });
      containerEl.appendChild(clearBtn);
    }

    return instance;
  }

  function renderWordDrawer(containerEl, characterString, mode = 'trace', options = {}) {
    if (!containerEl) {
      throw new Error('HanziDrawing.renderWordDrawer: containerEl is required.');
    }

    injectStyles();
    containerEl.innerHTML = '';

    const characters = [...(characterString || '')];
    if (characters.length === 0) {
      return { writers: [], canvases: [], container: containerEl };
    }

    const wordWrapper = document.createElement('div');
    wordWrapper.className = 'hanzi-drawing-word-container';
    containerEl.appendChild(wordWrapper);

    const lenClass = characters.length >= 3 ? 'char-len-3' : (characters.length === 2 ? 'char-len-2' : 'char-len-1');

    let targetSize = 140;
    if (options.width && options.height) {
      targetSize = options.width;
    } else if (characters.length === 2) {
      targetSize = 110;
    } else if (characters.length >= 3) {
      targetSize = 90;
    }

    const writers = [];
    const canvases = [];

    characters.forEach((char) => {
      const charWrapper = document.createElement('div');
      charWrapper.className = 'hanzi-drawing-char-wrapper';

      const targetDiv = document.createElement('div');
      targetDiv.className = `hanzi-drawing-target ${lenClass}`;
      targetDiv.style.width = `${targetSize}px`;
      targetDiv.style.height = `${targetSize}px`;
      targetDiv.style.position = 'relative';

      charWrapper.appendChild(targetDiv);
      wordWrapper.appendChild(charWrapper);

      const writerOptions = Object.assign(
        {
          width: targetSize,
          height: targetSize,
          padding: 5,
          showOutline: true,
          showCharacter: false,
          strokeAnimationSpeed: 1,
          delayBetweenStrokes: 200,
          strokeColor: '#1e293b',
          outlineColor: '#cbd5e1',
          charDataLoader: defaultCharDataLoader
        },
        options
      );

      const writer = HanziWriter.create(targetDiv, char, writerOptions);
      writers.push(writer);

      const canvasOverlayDiv = document.createElement('div');
      canvasOverlayDiv.style.position = 'absolute';
      canvasOverlayDiv.style.top = '0';
      canvasOverlayDiv.style.left = '0';
      canvasOverlayDiv.style.width = '100%';
      canvasOverlayDiv.style.height = '100%';
      canvasOverlayDiv.style.zIndex = '2';
      canvasOverlayDiv.style.background = 'transparent';
      targetDiv.appendChild(canvasOverlayDiv);

      const canvasInstance = createDrawableCanvas(canvasOverlayDiv, Object.assign({}, options, {
        width: targetSize,
        height: targetSize,
        showClearButton: false,
        strokeColor: options.strokeColor || '#1976d2'
      }));

      canvases.push(canvasInstance);

      const charClearBtn = document.createElement('button');
      charClearBtn.className = 'btn-hanzi-canvas-clear';
      charClearBtn.textContent = 'Clear';
      charClearBtn.style.marginTop = '6px';
      charClearBtn.addEventListener('click', () => canvasInstance.clear());
      charWrapper.appendChild(charClearBtn);
    });

    const controlsDiv = document.createElement('div');
    controlsDiv.className = 'hanzi-drawing-controls';

    const animateBtn = document.createElement('button');
    animateBtn.className = 'btn-hanzi-animate';
    animateBtn.innerHTML = '<span>▶</span> Animate Stroke Order';

    let isAnimating = false;
    animateBtn.addEventListener('click', async () => {
      if (isAnimating) return;
      isAnimating = true;
      animateBtn.disabled = true;
      animateBtn.style.opacity = '0.7';

      for (const writer of writers) {
        await new Promise((resolve) => writer.animateCharacter({ onComplete: resolve }));
      }

      isAnimating = false;
      animateBtn.disabled = false;
      animateBtn.style.opacity = '1';
    });

    controlsDiv.appendChild(animateBtn);
    containerEl.appendChild(controlsDiv);

    return {
      writers,
      canvases,
      container: containerEl
    };
  }

  function resampleStroke(points, numPoints = NUM_RESAMPLE_POINTS) {
    if (!points || points.length === 0) {
      return Array.from({ length: numPoints }, () => ({ x: 0, y: 0 }));
    }
    const pts = points.map(p => Array.isArray(p) ? { x: p[0], y: p[1] } : { x: p.x, y: p.y });
    if (pts.length === 1) {
      return Array.from({ length: numPoints }, () => ({ ...pts[0] }));
    }

    const distances = [0];
    let totalLen = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      totalLen += dist;
      distances.push(totalLen);
    }

    if (totalLen === 0) {
      return Array.from({ length: numPoints }, () => ({ ...pts[0] }));
    }

    const resampled = [ { ...pts[0] } ];
    const interval = totalLen / (numPoints - 1);
    let currentSegment = 0;

    for (let i = 1; i < numPoints - 1; i++) {
      const targetDist = i * interval;
      while (currentSegment < distances.length - 1 && distances[currentSegment + 1] < targetDist) {
        currentSegment++;
      }
      const p1 = pts[currentSegment];
      const p2 = pts[currentSegment + 1];
      const d1 = distances[currentSegment];
      const d2 = distances[currentSegment + 1];
      const t = (d2 === d1) ? 0 : (targetDist - d1) / (d2 - d1);

      resampled.push({
        x: p1.x + t * (p2.x - p1.x),
        y: p1.y + t * (p2.y - p1.y)
      });
    }

    resampled.push({ ...pts[pts.length - 1] });
    return resampled;
  }

  function computeStrokeDistance(userPoints, refPoints) {
    const K = Math.min(userPoints.length, refPoints.length);
    if (K === 0) return 1.0;

    let sumFwd = 0;
    let sumRev = 0;

    for (let i = 0; i < K; i++) {
      const uFwd = userPoints[i];
      const uRev = userPoints[K - 1 - i];
      const r = refPoints[i];

      const dxFwd = uFwd.x - r.x;
      const dyFwd = uFwd.y - r.y;
      sumFwd += Math.sqrt(dxFwd * dxFwd + dyFwd * dyFwd);

      const dxRev = uRev.x - r.x;
      const dyRev = uRev.y - r.y;
      sumRev += Math.sqrt(dxRev * dxRev + dyRev * dyRev);
    }

    return Math.min(sumFwd / K, sumRev / K);
  }

  async function loadCharData(character) {
    if (CUSTOM_STROKE_DATABASE && CUSTOM_STROKE_DATABASE[character]) {
      return CUSTOM_STROKE_DATABASE[character];
    }
    if (typeof HanziWriter !== 'undefined' && typeof HanziWriter.loadCharacterData === 'function') {
      try {
        return await HanziWriter.loadCharacterData(character);
      } catch (err) {}
    }
    const res = await fetch('https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/' + encodeURIComponent(character) + '.json');
    if (res.ok) return await res.json();
    throw new Error('Character data not found for ' + character);
  }

  async function gradeCharacterDrawing(userStrokes, character, options = {}) {
    const threshold = (typeof options.threshold === 'number') ? options.threshold : GRADE_THRESHOLD;
    const canvasWidth = options.width || 140;
    const canvasHeight = options.height || 140;

    if (!character) {
      return { character, score: 0, correct: false, reason: 'No character specified' };
    }

    let charData;
    try {
      charData = await loadCharData(character);
    } catch (err) {
      console.error('Failed to load character data for ' + character + ':', err);
      return { character, score: 0, correct: false, reason: 'Failed to load character data' };
    }

    if (!charData || !charData.medians || charData.medians.length === 0) {
      return { character, score: 0, correct: false, reason: 'Invalid character medians' };
    }

    const refMedians = charData.medians;
    const totalRefStrokes = refMedians.length;

    if (!userStrokes || userStrokes.length === 0) {
      return {
        character,
        score: 0,
        correct: false,
        rawScore: 0,
        penalty: 0,
        matchedStrokes: 0,
        totalReferenceStrokes: totalRefStrokes,
        userStrokeCount: 0
      };
    }

    const transform = getHanziTransform(Object.assign({ width: canvasWidth, height: canvasHeight }, options));

    const normRefStrokes = refMedians.map(median => {
      const rawPts = median.map(pt => ({
        x: (pt[0] * transform.scaleX + transform.translateX) / canvasWidth,
        y: (pt[1] * transform.scaleY + transform.translateY) / canvasHeight
      }));
      return resampleStroke(rawPts, NUM_RESAMPLE_POINTS);
    });

    const normUserStrokes = userStrokes.map(stroke => {
      const rawPts = stroke.map(pt => ({
        x: pt.x / canvasWidth,
        y: pt.y / canvasHeight
      }));
      return resampleStroke(rawPts, NUM_RESAMPLE_POINTS);
    });

    const M = normRefStrokes.length;
    const N = normUserStrokes.length;

    const pairs = [];
    for (let i = 0; i < M; i++) {
      for (let j = 0; j < N; j++) {
        const dist = computeStrokeDistance(normUserStrokes[j], normRefStrokes[i]);
        pairs.push({ refIdx: i, userIdx: j, distance: dist });
      }
    }

    pairs.sort((a, b) => a.distance - b.distance);

    const matchedRef = new Set();
    const matchedUser = new Set();
    const strokeSimilarities = new Array(M).fill(0);

    for (const pair of pairs) {
      if (matchedRef.has(pair.refIdx) || matchedUser.has(pair.userIdx)) {
        continue;
      }
      if (pair.distance <= MAX_MATCH_DISTANCE) {
        matchedRef.add(pair.refIdx);
        matchedUser.add(pair.userIdx);
        strokeSimilarities[pair.refIdx] = Math.max(0, 1 - (pair.distance / MAX_MATCH_DISTANCE));
      }
    }

    const sumSimilarity = strokeSimilarities.reduce((sum, val) => sum + val, 0);
    const rawScore = sumSimilarity / M;

    const extraStrokes = Math.max(0, N - M);
    const penalty = extraStrokes * PENALTY_PER_EXTRA_STROKE;

    const finalScore = Math.max(0, rawScore - penalty);
    const roundedScore = Math.round(finalScore * 100) / 100;

    return {
      character,
      score: roundedScore,
      correct: roundedScore >= threshold,
      rawScore: Math.round(rawScore * 100) / 100,
      penalty: Math.round(penalty * 100) / 100,
      matchedStrokes: matchedRef.size,
      totalReferenceStrokes: M,
      userStrokeCount: N
    };
  }

  window.HanziDrawing = {
    createDrawableCanvas: createDrawableCanvas,
    renderWordDrawer: renderWordDrawer,
    gradeCharacterDrawing: gradeCharacterDrawing,
    getHanziTransform: getHanziTransform,
    resampleStroke: resampleStroke,
    computeStrokeDistance: computeStrokeDistance,
    defaultCharDataLoader: defaultCharDataLoader,
    loadCharData: loadCharData,
    CUSTOM_STROKE_DATABASE: CUSTOM_STROKE_DATABASE,
    GRADE_THRESHOLD: GRADE_THRESHOLD,
    MAX_MATCH_DISTANCE: MAX_MATCH_DISTANCE,
    PENALTY_PER_EXTRA_STROKE: PENALTY_PER_EXTRA_STROKE,
    NUM_RESAMPLE_POINTS: NUM_RESAMPLE_POINTS
  };

})(window);
